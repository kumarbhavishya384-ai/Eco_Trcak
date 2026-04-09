@echo off
title Launching EcoTrack AI...
echo ===================================================
echo   EcoTrack AI - Starting Systems
echo ===================================================
echo.

:: ── STEP 0: Kill any old running instances ──────────
echo [0/4] Stopping any old running instances...

:: Kill old Flask backend on port 5050
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5050" ^| find "LISTENING"') do (
    echo Killing old backend process PID: %%a
    taskkill /PID %%a /F >nul 2>&1
)

:: Kill old Frontend server on port 8080
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8080" ^| find "LISTENING"') do (
    echo Killing old frontend process PID: %%a
    taskkill /PID %%a /F >nul 2>&1
)

:: Kill any old EcoTrack terminal windows
taskkill /FI "WINDOWTITLE eq EcoTrack Backend" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq EcoTrack Frontend" /F >nul 2>&1

echo [✓] Old instances cleared!
echo.

:: ── STEP 1: Check Python ────────────────────────────
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python from python.org
    pause
    exit /b
)

:: ── STEP 2: Check Dependencies ──────────────────────
echo [1/4] Checking dependencies...
python -c "import flask, flask_cors, pymongo, jwt, bcrypt, google.generativeai, twilio, requests, sklearn, pandas, numpy" >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Installing required libraries...
    python -m pip install flask flask-cors pymongo pyjwt bcrypt python-dotenv google-generativeai twilio requests scikit-learn pandas numpy
)
echo [✓] Dependencies OK!
echo.

:: ── STEP 3: Start Backend ───────────────────────────
echo [2/4] Starting Backend Server (Flask on port 5050)...
start "EcoTrack Backend" cmd /k "cd /d %~dp0backend_py && python app.py"
timeout /t 3 /nobreak > nul
echo [✓] Backend started!
echo.

:: ── STEP 4: Start Frontend ──────────────────────────
echo [3/4] Starting Frontend Server (HTTP on port 8080)...
start "EcoTrack Frontend" cmd /k "cd /d %~dp0 && python -m http.server 8080"
timeout /t 2 /nobreak > nul
echo [✓] Frontend started!
echo.

:: ── STEP 5: Open Browser ────────────────────────────
echo [4/4] Opening Website in your browser...
timeout /t 2 /nobreak > nul
start http://localhost:8080

echo.
echo ===================================================
echo   App is LIVE at http://localhost:8080
echo   Attention: Keep the two command windows open!
echo ===================================================
echo   Backend window  → Flask API logs
echo   Frontend window → HTTP server logs
echo ===================================================
pause
