# CholesterolWise API

All reference-range decisions and derived calculations run in Python. React submits a JSON request to the API and renders its response. There is no frontend classification fallback.

## Start

From the `web` directory, using Python 3.12:

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r backend/requirements-dev.txt
npm install
npm run build
.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --no-access-log
```

The same server serves the website at `http://127.0.0.1:8000` and interactive API documentation at `http://127.0.0.1:8000/docs`. The project-root `Start-CholesterolWise.ps1` script builds and starts both parts with one command.

For development, run the Python server and `npm run dev` in separate terminals. Vite proxies `/api` to port 8000. Changes to React are live; use `--reload` with Uvicorn when developing Python.

## Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Service health and engine version |
| GET | `/api/reference-ranges` | Backend reference categories, input caps and formulas |
| POST | `/api/analyze` | Validate inputs and return the complete analysis |

Example request:

```json
{"ldl":120,"hdl":45,"total":210,"sex":"unspecified"}
```

Values must be JSON numbers in mg/dL. `sex` accepts `unspecified` (default), `male`, or `female` and selects the corresponding adult HDL reference context. Unknown fields, booleans, strings, non-finite numbers, zero/negative values, and obvious inconsistent totals are rejected. Upper input caps catch unit/typing errors; they are not clinical reference cutoffs.

The response includes the submitted readings, categories and explanations, reference-scale segments/markers, calculated values, formulas, general scope, source URLs and an analysis-engine version. Validation errors use HTTP 422 with `message` and `field_errors`, which React displays next to the relevant input. API responses use `Cache-Control: no-store`.

## Calculation rules

- LDL and total cholesterol: compare the supplied measurement against reference-category cutoffs.
- HDL: select the reference context, then compare the measurement.
- Non-HDL cholesterol = total cholesterol − HDL cholesterol.
- Total/HDL ratio = total cholesterol ÷ HDL cholesterol, rounded to two decimal places using decimal half-up rounding.

LDL is entered from the report. It is not estimated using the Friedewald formula because triglycerides are not collected. Derived values are descriptive and are not used to calculate cardiovascular risk or recommend treatment.

No patient records, accounts, database, request-body logs or external analysis services are implemented. The running server processes values in memory. Reverse-proxy and hosting logs should also be configured to avoid recording request bodies.

## Tests

```powershell
python -m pytest backend/tests -q
npm test
npm run build
```

The backend tests cover thresholds, HDL context, malformed payloads, decimal calculations, headers, API documentation, static serving, separate-origin configuration and request isolation.

## Deployment

Deploy the entire `web` directory to a Python/container host, with `npm ci && npm run build` as the frontend build and `uvicorn backend.main:app --host 0.0.0.0 --port <assigned-port> --no-access-log` as the server command. The Dockerfile also builds and runs the complete application; it honors the host's `PORT` variable.

```powershell
docker build -t cholesterolwise .
docker run --rm -p 8000:8000 cholesterolwise
```

The existing private Sites URL is a static preview and cannot execute this FastAPI service. Do not replace it with an API-dependent static build without a separately hosted API. The current backend-integrated version is verified locally; the prior published preview remains available until Python hosting is configured.

If hosting React separately, set `VITE_API_BASE_URL` before building React and set backend `CORS_ORIGINS` to the exact frontend HTTPS origin(s), comma separated. Same-origin deployment is the simplest configuration and needs neither setting. Use HTTPS for a remote deployment.
