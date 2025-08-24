@echo off
title Python Learning Portal Launcher
echo ================================================
echo   Python Learning Portal External Launcher
echo ================================================
echo.
echo This will start the portal in an external PowerShell window
echo with real-time logging to portal.log
echo.
echo Press any key to launch, or Ctrl+C to cancel...
pause >nul

cd /d "C:\Users\darre\Downloads\python_foundations_exercises\python_foundations_exercises\python-learning-portal"

REM Kill any existing PowerShell windows with our title
taskkill /FI "WINDOWTITLE eq Python Learning Portal*" /F >nul 2>&1

REM Start in new external PowerShell window
start "Python Learning Portal Console" powershell.exe -ExecutionPolicy Bypass -NoExit -Command "Set-Location 'C:\Users\darre\Downloads\python_foundations_exercises\python_foundations_exercises\python-learning-portal'; & '.\start-portal.ps1'"

echo.
echo ✅ Portal launched in external window
echo 📝 Check portal.log for real-time logs
echo 🌍 Frontend: http://localhost:3002
echo 📊 Backend: http://localhost:3001
echo.
pause