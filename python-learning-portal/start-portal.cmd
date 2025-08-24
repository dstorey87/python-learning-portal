@echo off
echo Starting Python Learning Portal in external terminal...
cd /d "C:\Users\darre\Downloads\python_foundations_exercises\python_foundations_exercises\python-learning-portal"
start "Python Learning Portal" powershell -ExecutionPolicy Bypass -NoExit -File "start-portal.ps1"