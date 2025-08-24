@echo off
cd /d "%~dp0"
echo.
echo 🚀 PYTHON LEARNING PORTAL - AUTO LAUNCHER
echo ==========================================
echo Starting hands-free service monitoring...
echo Press Ctrl+C to stop
echo.

powershell -ExecutionPolicy Bypass -Command "& '.\auto-launcher.ps1'"

pause