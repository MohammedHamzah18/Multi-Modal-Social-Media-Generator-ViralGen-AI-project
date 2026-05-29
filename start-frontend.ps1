# VoiceOps Sentinel — start React UI on http://localhost:5173
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\frontend

Write-Host "=== VoiceOps Frontend ===" -ForegroundColor Cyan

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm packages..."
    npm install
}

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
}

Write-Host ""
Write-Host "UI: http://localhost:5173" -ForegroundColor Green
Write-Host "Make sure start-backend.ps1 is running first!" -ForegroundColor Yellow
Write-Host ""

npm run dev
