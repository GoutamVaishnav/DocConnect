@echo off
setlocal

cd /d "%~dp0"

if not exist "C:\Program Files\nodejs\npm.cmd" (
  echo Node.js was not found at C:\Program Files\nodejs.
  echo Install Node.js 22 or later, then run this file again.
  exit /b 1
)

echo Opening separate terminals for DocConnect...
start "DocConnect API Gateway" "%ComSpec%" /k call "%~dp0run-gateway.cmd"
start "DocConnect Mobile" "%ComSpec%" /k call "%~dp0run-mobile.cmd"

echo Gateway: http://localhost:3000
echo Expo will show its QR code in the DocConnect Mobile window.
