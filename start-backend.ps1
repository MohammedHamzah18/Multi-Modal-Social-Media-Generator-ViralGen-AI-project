# VoiceOps Sentinel — start API server on http://localhost:8000
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\backend

Write-Host "=== VoiceOps Backend ===" -ForegroundColor Cyan

if (-not (Test-Path ".venv\Scripts\Activate.ps1")) {
    Write-Host "Creating virtual environment..."
    python -m venv .venv
}

& .\.venv\Scripts\Activate.ps1

Write-Host "Installing dependencies..."
pip install -r requirements.txt -q
pip install aiosqlite -q

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created backend\.env (SQLite database)" -ForegroundColor Yellow
}

New-Item -ItemType Directory -Force -Path "data", "uploads" | Out-Null

$backendHealthy = $false
try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -TimeoutSec 2
    if ($health.status -eq "healthy") {
        $backendHealthy = $true
    }
} catch {
    # Port may be occupied by a stuck process — fall through and try to start.
}

if ($backendHealthy) {
    Write-Host ""
    Write-Host "Backend is already running on http://localhost:8000" -ForegroundColor Green
    Write-Host "Health: http://localhost:8000/health" -ForegroundColor Green
    Write-Host ""
    exit 0
}

$portInUse = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host ""
    Write-Host "Port 8000 is in use but the API is not responding." -ForegroundColor Red
    Write-Host "Close other backend terminals, then run:" -ForegroundColor Yellow
    Write-Host "  Get-NetTCPConnection -LocalPort 8000 | ForEach-Object { Stop-Process -Id `$_.OwningProcess -Force }" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "API:    http://localhost:8000" -ForegroundColor Green
Write-Host "Docs:   http://localhost:8000/docs" -ForegroundColor Green
Write-Host "Health: http://localhost:8000/health" -ForegroundColor Green
Write-Host ""
Write-Host "Keep this window open. Press Ctrl+C to stop." -ForegroundColor Yellow
Write-Host ""

uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
