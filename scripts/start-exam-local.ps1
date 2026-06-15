$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$IndexHtml = Join-Path $RepoRoot "frontend\dist\index.html"
$Url = "http://127.0.0.1:8000"

if (-not (Get-Command "uv" -ErrorAction SilentlyContinue)) {
    throw "Required command 'uv' was not found on PATH. Install uv before exam day."
}

if (-not (Test-Path $IndexHtml)) {
    throw "Offline frontend build not found at frontend\dist\index.html. This launcher cannot install dependencies or build assets during the exam."
}

Set-Location $RepoRoot

Write-Host "Starting offline exam localhost..."
Write-Host "Open $Url in your browser."
Write-Host "Keep this terminal open. Press Ctrl+C to stop."

uv run --no-sync uvicorn app.local_exam:app --app-dir backend --host 127.0.0.1 --port 8000
