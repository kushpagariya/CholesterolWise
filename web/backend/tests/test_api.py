from concurrent.futures import ThreadPoolExecutor

import pytest
from fastapi.testclient import TestClient

from backend.main import create_app


@pytest.fixture
def client():
    with TestClient(create_app()) as api:
        yield api


VALID = {"ldl": 120, "hdl": 45, "total": 210, "sex": "unspecified"}


def test_full_sample_response(client):
    response = client.post("/api/analyze", json=VALID)
    assert response.status_code == 200
    body = response.json()
    assert body["metrics"]["ldl"]["label"] == "Near optimal"
    assert body["metrics"]["hdl"]["label"] == "Context-dependent"
    assert body["metrics"]["total"]["label"] == "Borderline high"
    assert body["derived"]["non_hdl"]["value"] == 165
    assert body["derived"]["total_hdl_ratio"]["value"] == 4.67
    assert body["readings"] == VALID
    assert response.headers["cache-control"] == "no-store"


@pytest.mark.parametrize("value,label", [
    (99.9, "Optimal"), (100, "Near optimal"), (129.9, "Near optimal"),
    (130, "Borderline high"), (159.9, "Borderline high"),
    (160, "High"), (189.9, "High"), (190, "Very high"),
])
def test_ldl_boundaries(client, value, label):
    body = client.post("/api/analyze", json={**VALID, "ldl": value}).json()
    assert body["metrics"]["ldl"]["label"] == label


@pytest.mark.parametrize("value,label", [(199.9, "Desirable"), (200, "Borderline high"), (239.9, "Borderline high"), (240, "High")])
def test_total_boundaries(client, value, label):
    assert client.post("/api/analyze", json={**VALID, "total": value}).json()["metrics"]["total"]["label"] == label


@pytest.mark.parametrize("value,sex,label", [
    (39.9, "unspecified", "Low"), (40, "unspecified", "Context-dependent"),
    (45, "male", "Intermediate"), (45, "female", "Low"),
    (49.9, "female", "Low"), (50, "female", "Intermediate"),
    (59.9, "male", "Intermediate"), (60, "unspecified", "Generally favorable"),
])
def test_hdl_context(client, value, sex, label):
    assert client.post("/api/analyze", json={**VALID, "hdl": value, "sex": sex}).json()["metrics"]["hdl"]["label"] == label


@pytest.mark.parametrize("value", [0, -1, True, False, "120", "", None, "Infinity", "NaN", 1001])
def test_invalid_values_rejected_without_echoing_inputs(client, value):
    response = client.post("/api/analyze", json={**VALID, "ldl": value})
    assert response.status_code == 422
    assert "ldl" in response.json()["field_errors"]
    assert "input" not in response.json()


def test_non_finite_json_number(client):
    response = client.post("/api/analyze", content='{"ldl":NaN,"hdl":45,"total":210}', headers={"Content-Type": "application/json"})
    assert response.status_code == 422
    assert "ldl" in response.json()["field_errors"]


@pytest.mark.parametrize("body", [{}, {"ldl": 100}, {**VALID, "unexpected": 1}, {**VALID, "sex": "unknown"}])
def test_missing_fields_and_bad_contract(client, body):
    assert client.post("/api/analyze", json=body).status_code == 422


def test_malformed_json(client):
    assert client.post("/api/analyze", content="{broken", headers={"Content-Type": "application/json"}).status_code == 422


@pytest.mark.parametrize("body", [{**VALID, "total": 100}, {**VALID, "ldl": 20, "hdl": 60, "total": 50}])
def test_total_cannot_be_lower_than_components(client, body):
    response = client.post("/api/analyze", json=body)
    assert response.status_code == 422
    assert "total" in response.json()["field_errors"]


def test_calculations_preserve_decimal_accuracy(client):
    body = client.post("/api/analyze", json={**VALID, "total": 210.1, "hdl": 45.2}).json()
    assert body["derived"]["non_hdl"]["value"] == 164.9
    assert body["derived"]["total_hdl_ratio"]["value"] == 4.65


def test_input_caps_and_clipped_scale(client):
    response = client.post("/api/analyze", json={"ldl": 1000, "hdl": 300, "total": 1500})
    assert response.status_code == 200
    assert response.json()["metrics"]["ldl"]["scale"]["marker_percent"] == 98


def test_reference_endpoint_exposes_rules_and_formulas(client):
    body = client.get("/api/reference-ranges").json()
    assert body["categories"]["ldl"][0]["upper_exclusive"] == 100
    assert body["categories"]["hdl"]["female"][0]["upper_exclusive"] == 50
    assert body["calculations"]["non_hdl"] == "Total cholesterol − HDL cholesterol"
    assert body["unit"] == "mg/dL"


def test_health_docs_and_unknown_routes(client):
    assert client.get("/api/health").json()["status"] == "ok"
    assert "/api/analyze" in client.get("/openapi.json").json()["paths"]
    response = client.get("/api/not-found")
    assert response.status_code == 404
    assert response.headers["content-type"] == "application/json"


def test_frontend_and_api_share_an_origin(tmp_path):
    (tmp_path / "index.html").write_text("<html>CholesterolWise</html>", encoding="utf-8")
    with TestClient(create_app(tmp_path)) as client:
        assert client.get("/").status_code == 200
        assert "CholesterolWise" in client.get("/").text
        assert client.post("/api/analyze", json=VALID).status_code == 200
        assert client.get("/backend/main.py").status_code == 404


def test_requests_do_not_share_patient_state():
    def run(value):
        with TestClient(create_app()) as api:
            return api.post("/api/analyze", json={**VALID, "ldl": value}).json()["readings"]["ldl"]
    values = [80, 120, 150, 195]
    with ThreadPoolExecutor(max_workers=4) as executor:
        assert list(executor.map(run, values)) == values


def test_separate_origin_configuration_is_explicit(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "https://example.test")
    with TestClient(create_app()) as api:
        allowed = api.options("/api/analyze", headers={"Origin": "https://example.test", "Access-Control-Request-Method": "POST"})
        denied = api.options("/api/analyze", headers={"Origin": "https://other.test", "Access-Control-Request-Method": "POST"})
        assert allowed.headers["access-control-allow-origin"] == "https://example.test"
        assert "access-control-allow-origin" not in denied.headers
