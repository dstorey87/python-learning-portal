@echo off
cd /d "C:\Users\darre\Downloads\python_foundations_exercises\python_foundations_exercises\python-learning-portal"
echo Starting Python Learning Portal Background Service...
powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File "background-service.ps1" -Start
pause