@echo off
echo ========================================
echo Realistic Tree Fire Simulator
echo ========================================
echo.
echo Starting web server and opening simulator...
echo.
echo Access the application at:
echo http://localhost:5000/fire-simulator/
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

start http://localhost:5000/fire-simulator/
python app.py

pause
