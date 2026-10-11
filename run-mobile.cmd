@echo off
setlocal

cd /d "%~dp0"
set "NPM_CMD=C:\Program Files\nodejs\npm.cmd"

if not exist "%NPM_CMD%" (
  echo Node.js was not found at C:\Program Files\nodejs.
  echo Install Node.js 22 or later, then run this file again.
  exit /b 1
)

if not exist "node_modules" (
  echo Installing project packages. This is needed only the first time.
  call "%NPM_CMD%" install
  if errorlevel 1 exit /b 1
)

echo Starting DocConnect Mobile / Expo...
call "%NPM_CMD%" run mobile
