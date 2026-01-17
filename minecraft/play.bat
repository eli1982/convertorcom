@echo off
echo ===============================================
echo        MINECRAFT CLONE - STARTING GAME
echo ===============================================
echo.
echo Starting web server...
cd /d "%~dp0"
node start_game.js
pause
