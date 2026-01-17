@echo off
echo Starting Minecraft Server...
cd /d "%~dp0"
npm install
node server.js
pause
