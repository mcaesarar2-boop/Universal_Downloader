@echo off
title Universal Video Downloader - Full-Stack Web Suite
color 0a

echo =======================================================================
echo    UNIVERSAL VIDEO DOWNLOADER - FULL-STACK WEB MODE
echo =======================================================================
echo.
echo  [*] Verifying Python installation...
where python >nul 2>nul
if %errorlevel% neq 0 (
    color 0c
    echo [ERROR] Python is not installed or not registered in your PATH.
    pause
    exit /b
)

echo  [*] Verifying Node.js environment...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    color 0c
    echo [ERROR] Node.js/npm was not found in your system PATH.
    pause
    exit /b
)

echo.
echo  [+] Launching Flask API Backend...
start "Universal Video Downloader - Flask API Backend" cmd /k "color 0b && echo Running local Python server on port 5000... && python app.py"

echo  [+] Launching React Web Frontend...
start "Universal Video Downloader - Vite React Web UI" cmd /k "color 0d && echo Booting Vite development UI client... && npm run dev"

echo.
echo =======================================================================
echo  [SUCCESS] All systems initialized successfully!
echo =======================================================================
echo  - Flask backend will listen on: http://localhost:5000
echo  - React frontend will be available at: http://localhost:3000
echo.
echo  Press any key to close this launcher menu (services will keep running).
pause >nul
exit
