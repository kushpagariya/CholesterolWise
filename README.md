# CholesterolWise

A responsive React website that explains LDL, HDL and total cholesterol through reference-range analysis, charts and interactive 3D educational scenes.

## Run the complete website locally

Requires Node.js 22.12+ and Python 3.12. The backend validates measurements, applies every clinical reference rule and calculates non-HDL cholesterol and the total/HDL ratio. React renders the returned results.

```powershell
cd web
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r backend/requirements-dev.txt
npm install
npm run build
.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --no-access-log
```

Open `http://127.0.0.1:8000`. Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

After installing dependencies, you can also run `./Start-CholesterolWise.ps1` from the project root. Add `-SkipBuild` to use the existing frontend build. Stop the server with Ctrl+C.

For development, run the Python server and `npm run dev` in separate terminals; Vite forwards `/api` requests to port 8000. The application uses hash routing, so all screens work with FastAPI's static-file serving.

```powershell
# From web, with the Python environment activated:
python -m pytest backend/tests -q
npm test
npm run build
```

Read [backend setup and deployment](web/backend/README.md) for the API contract, calculations, Docker setup and configuration for separate hosts. The existing private Sites preview cannot execute Python and remains the previous frontend-only version until Python hosting is configured. Run the local server to use this backend-integrated version.

## Included

- Landing page with a rotatable, animated schematic 3D heart.
- Analyzer with numeric validation, optional adult HDL reference context, and clearly labeled sample values.
- Dashboard with individual classifications, range markers, a bar chart, explanations and print/save-as-PDF support through the browser print dialog.
- Learn page with cholesterol topics, general healthy-habit awareness and FAQs.
- PCSK9 explorer with a 3D receptor mechanism, recycling/PCSK9 pathway comparison, four manual stages, playback, reset, orbit controls and a schematic DNA view.
- Responsive navigation, keyboard focus styles, reduced-motion support and static illustrations when WebGL is unavailable.

## Technology

React, TypeScript, Vite, Three.js, React Three Fiber, Drei, Chart.js, custom CSS, Python, FastAPI and Pydantic. No ML, authentication or database. Readings are submitted to the API for server-side analysis; the app does not save patient records. The results in the React tab clear on reload. Google Fonts is used for typography, with local system fallbacks.

The 3D models are original procedural educational illustrations, not patient anatomy or experimentally resolved molecular structures. The PCSK9 gene provides instructions for a protein; the mechanism scene represents the protein's interaction with LDL receptors.

## Interpretation and sources

The analyzer uses general adult reference categories for people aged 20 and over, not personalized treatment targets. It does not diagnose disease, estimate cardiovascular risk or prescribe treatment. Decimal thresholds use continuous comparisons (for example, LDL below 130 remains near-optimal).

- [MedlinePlus: cholesterol levels](https://medlineplus.gov/lab-tests/cholesterol-levels/)
- [MedlinePlus Genetics: PCSK9](https://medlineplus.gov/genetics/gene/pcsk9/)
- [NHLBI: therapeutic lifestyle changes](https://www.nhlbi.nih.gov/health/TLC-Therapeutic-Lifestyle-Changes-Lower-Cholesterol)

The Python test suite covers clinical category boundaries, HDL context, input contracts, decimal calculations and API/static serving. Vitest covers form input checks and API success, validation, connection, malformed-response, cancellation and timeout behavior. Browser QA should include both WebGL scenes, mobile navigation, sample/edited analyses and print preview.
