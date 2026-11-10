@echo off
cd /d "%~dp0"
echo ========================================================
echo   Starting Naam Uzhavar Web Application...
echo ========================================================
echo.
echo Opening browser at http://localhost:5173/
echo Press Ctrl+C in this window to stop the server.
echo.
timeout /t 2 /nobreak >nul
start http://localhost:5173/
call npm.cmd run dev
pause
