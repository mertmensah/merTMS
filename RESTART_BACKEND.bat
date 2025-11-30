@echo off
echo ========================================
echo   KILLING OLD BACKEND PROCESSES
echo ========================================

REM Kill all Python processes
taskkill /F /IM python.exe /T 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [DONE] All Python processes killed
echo.
echo ========================================
echo   STARTING FRESH BACKEND
echo ========================================
echo.

cd /d "%~dp0backend"
C:\Users\MertMM\anaconda3\envs\streamlitenv\python.exe app.py

pause
