param(
    [ValidateRange(1024, 65535)][int]$Port = 8000,
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
$projectDirectory = $PSScriptRoot
Push-Location -LiteralPath $projectDirectory
try {
    $localPython = Join-Path $projectDirectory '.venv\Scripts\python.exe'
    $pythonCommand = if (Test-Path -LiteralPath $localPython) { $localPython } else { 'python' }
    & $pythonCommand -c 'import fastapi, pydantic, uvicorn'
    if ($LASTEXITCODE -ne 0) { throw 'Install backend dependencies: python -m pip install -r backend/requirements.txt' }
    if (-not $SkipBuild) {
        & npm run build
        if ($LASTEXITCODE -ne 0) { throw 'The React production build failed.' }
    }
    if (-not (Test-Path -LiteralPath 'dist\index.html')) { throw 'Build the frontend first: npm run build' }
    Write-Host "CholesterolWise: http://127.0.0.1:$Port"
    Write-Host "API documentation: http://127.0.0.1:$Port/docs"
    Write-Host 'Press Ctrl+C to stop.'
    & $pythonCommand -m uvicorn backend.main:app --host 127.0.0.1 --port $Port --no-access-log
} finally {
    Pop-Location
}
