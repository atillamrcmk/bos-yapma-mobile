@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"
echo Starting Expo (LAN) — QR will appear below...
"C:\Program Files\nodejs\npx.cmd" expo start --lan
pause
