@echo off
title AgriConnect Ghana – Local Demo Launcher
color 0A
echo.
echo  ============================================================
echo    AgriConnect Ghana  ^|  CS410 Demo Launcher
echo  ============================================================
echo.

REM ─── Step 1: Start the Node.js API backend ───────────────────
echo  [1/3] Starting AgriConnect API (Node.js backend)...
cd /d "%~dp0backend"
start "AgriConnect API" cmd /k "node server.js"
timeout /t 2 /nobreak >nul

REM ─── Step 2: Build the React frontend and copy to htdocs ─────
echo  [2/3] Building frontend and deploying to XAMPP htdocs...
cd /d "%~dp0frontend"
call npm run build

REM Attempt to copy to XAMPP htdocs (adjust path if XAMPP is installed elsewhere)
set HTDOCS=C:\xampp\htdocs\agriconnect
if exist "C:\xampp\htdocs" (
    if not exist "%HTDOCS%" mkdir "%HTDOCS%"
    xcopy /E /Y /Q dist\* "%HTDOCS%\"
    echo.
    echo  [3/3] Frontend deployed to: %HTDOCS%
    echo.
    echo  ============================================================
    echo   AgriConnect is now running!
    echo.
    echo   ^> API (backend):   http://localhost:4000/api/health
    echo   ^> Web app (XAMPP): http://localhost/agriconnect/
    echo  ============================================================
    echo.
    explorer "http://localhost/agriconnect/"
) else (
    echo.
    echo  [!] XAMPP htdocs not found at C:\xampp\htdocs
    echo      Opening Vite dev server instead...
    echo.
    echo  ============================================================
    echo   AgriConnect is now running (dev mode)!
    echo.
    echo   ^> API (backend):   http://localhost:4000/api/health
    echo   ^> Web app (Vite):  http://localhost:5173
    echo  ============================================================
    echo.
    start "AgriConnect Frontend" cmd /k "npm run dev"
    timeout /t 3 /nobreak >nul
    explorer "http://localhost:5173"
)

echo  Press any key to close this window...
pause >nul
