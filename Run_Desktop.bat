@echo off
title Universal Video Downloader - Standalone Desktop GUI
color 0b

echo =======================================================================
echo    UNIVERSAL VIDEO DOWNLOADER - DESKTOP MODE
echo =======================================================================
echo  [*] Verifying Python environment...
where python >nul 2>nul
if %errorlevel% neq 0 (
    color 0c
    echo [ERROR] Python was not found in your system PATH.
    echo Please install Python 3.8+ and try again.
    pause
    exit /b
)

echo  [*] Launching CustomTkinter Desktop Application...
python downloader.py
if %errorlevel% neq 0 (
    color 0c
    echo.
    echo [ERROR] The application exited with an error.
    echo Please ensure all dependencies are installed (pip install customtkinter yt-dlp requests).
    pause
)
exit
