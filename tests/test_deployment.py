"""Exercise the deployed Vercel ASGI entry point, not a separate mock app."""

from fastapi.testclient import TestClient

from api.index import app


def test_serverless_health():
    with TestClient(app) as client:
        response = client.get('/api/health')
        assert response.status_code == 200
        assert response.json()['status'] == 'ok'


def test_serverless_analysis_uses_shared_backend():
    with TestClient(app) as client:
        response = client.post('/api/analyze', json={'ldl': 120, 'hdl': 45.2, 'total': 210.1, 'sex': 'female'})
        assert response.status_code == 200
        result = response.json()
        assert result['metrics']['hdl']['label'] == 'Low'
        assert result['derived']['non_hdl']['value'] == 164.9
        assert result['derived']['total_hdl_ratio']['value'] == 4.65
        assert response.headers['cache-control'] == 'no-store'


def test_serverless_rejects_inconsistent_values():
    with TestClient(app) as client:
        response = client.post('/api/analyze', json={'ldl': 120, 'hdl': 45, 'total': 100})
        assert response.status_code == 422
        assert 'total' in response.json()['field_errors']


def test_serverless_does_not_serve_project_files():
    with TestClient(app) as client:
        assert client.get('/backend/analysis.py').status_code == 404
