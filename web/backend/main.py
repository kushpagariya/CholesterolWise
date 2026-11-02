import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .analysis import ENGINE_VERSION, analyze, reference_ranges
from .models import AnalysisResponse, INPUT_LIMITS, Readings


def create_app(static_dir: Path | None = None) -> FastAPI:
    app = FastAPI(title="CholesterolWise API", version=ENGINE_VERSION,
                  description="Server-side validation and educational cholesterol interpretation. No readings are saved.")
    origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "").split(",") if origin.strip()]
    if origins:
        if "*" in origins:
            raise ValueError("Use explicit CORS_ORIGINS rather than a wildcard.")
        app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])

    @app.middleware("http")
    async def response_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        if request.url.path.startswith("/api"):
            response.headers["Cache-Control"] = "no-store"
        return response

    @app.exception_handler(RequestValidationError)
    async def validation_error(_request: Request, exc: RequestValidationError):
        fields = {}
        for error in exc.errors():
            key = next((part for part in error["loc"] if part in INPUT_LIMITS or part == "sex"), None)
            if key is None:
                continue
            kind = error["type"]
            if kind == "missing":
                message = "Enter a value from your report."
            elif kind in ("float_type", "float_parsing", "finite_number", "greater_than"):
                message = "Enter a finite number greater than zero."
            elif kind == "less_than_equal":
                message = f"Check the units and value (maximum {INPUT_LIMITS[key]} mg/dL)."
            elif kind == "literal_error":
                message = "Choose one of the available HDL reference contexts."
            else:
                message = error["msg"]
            fields[key] = message
        # Never include the request body or raw input in error responses/logs.
        return JSONResponse(status_code=422, content={"message": "Check the highlighted values and try again." if fields else "Send valid JSON with LDL, HDL and total cholesterol values.", "field_errors": fields})

    @app.get("/api/health")
    def health():
        return {"status": "ok", "service": "cholesterolwise-api", "engine_version": ENGINE_VERSION}

    @app.get("/api/reference-ranges")
    def ranges():
        return reference_ranges()

    @app.post("/api/analyze", response_model=AnalysisResponse)
    def analyze_values(readings: Readings):
        return analyze(readings)

    @app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"], include_in_schema=False)
    def unknown_api(path: str):
        return JSONResponse(status_code=404, content={"message": "API endpoint not found."})

    # A production build and API share the same origin; no CORS setup is needed.
    build = static_dir if static_dir is not None else Path(__file__).resolve().parents[1] / "dist"
    if build.is_dir():
        app.mount("/", StaticFiles(directory=build, html=True), name="website")
    return app


app = create_app()
