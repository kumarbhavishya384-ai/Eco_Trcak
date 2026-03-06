@echo off
title Launching EcoTrack AI...
echo ===================================================
echo   🌿 EcoTrack AI - Starting Systems 🌿
echo ===================================================
echo.

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python from python.org
    pause
    exit /b
)

:: Ensure dependencies are installed for THIS python version
echo [0/3] Checking dependencies...
python -c "import flask, flask_cors, pymongo, jwt, bcrypt, google.generativeai, twilio, requests" >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Installing required libraries...
    python -m pip install flask flask-cors pymongo pyjwt bcrypt python-dotenv google-generativeai twilio requests
)

:: 1. Start the Python Backend (MongoDB API on port 5050)
echo [1/3] Starting Backend Server (Flask on port 5050)...
start "EcoTrack Backend" cmd /k "cd /d %~dp0 && python backend_py/app.py"

:: 2. Start the Frontend Server (Port 8080)
echo [2/3] Starting Frontend Server (HTTP on port 8080)...
start "EcoTrack Frontend" cmd /k "cd /d %~dp0 && python -m http.server 8080"

:: 3. Launch the Browser
echo [3/3] Opening Website in your browser...
timeout /t 5 /nobreak > nul
start http://localhost:8080

echo.
echo ===================================================
echo   🚀 App is LIVE at http://localhost:8080
echo   ⚠️ Keep the two command windows open while using!
echo ===================================================
echo   If you see "Failed to fetch", check the Backend window
echo   for MongoDB error messages.
echo ===================================================
pause
