@echo off
title VoiceOps Sentinel
echo Starting VoiceOps Sentinel...
echo.
echo TWO windows will open:
echo   1. Backend  (port 8000) - wait until you see "Application startup complete"
echo   2. Frontend (port 5173)
echo.
start "VoiceOps BACKEND - keep open" cmd /k "%~dp0start-backend.ps1"
timeout /t 5 /nobreak >nul
start "VoiceOps FRONTEND" cmd /k "%~dp0start-frontend.ps1"
echo.
echo Open http://localhost:5173/register in your browser
pause
