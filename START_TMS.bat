@echo off
REM merTM.S - Quick Start Script
REM This script starts both backend and frontend servers

echo.
echo ========================================
echo   merTM.S - Transportation Management System
echo ========================================
echo.
echo [INFO] Starting servers...
echo.

REM Start backend server in new window
echo [START] Starting backend server on port 5000...
start "merTM.S Backend" cmd /k "cd /d "%~dp0backend" && C:\Users\MertMM\anaconda3\envs\streamlitenv\python.exe app.py"

REM Wait for backend to start
timeout /t 5 /nobreak >nul

REM Change to frontend directory
cd /d "%~dp0frontend"

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [SETUP] Installing frontend dependencies...
    call npm install
)

REM Start frontend server in new window
echo [START] Starting frontend server on port 5173...
start "merTM.S Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

REM Wait for Vite to fully start
echo [WAIT] Waiting for Vite to start (10 seconds)...
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo   merTM.S Servers Started!
echo ========================================
echo.
echo Backend API: http://localhost:5000
echo Frontend UI: http://localhost:5173
echo.
echo Press any key to open the application in your browser...
pause >nul

REM Open browser
start http://localhost:5173

echo.
echo To stop the servers, close the terminal windows
echo or press Ctrl+C in each window
echo.
