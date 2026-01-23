@echo off
TITLE Jyotish Career Launcher
ECHO Starting Jyotish Career Application...

:: Set the environment variable for development
SET NODE_ENV=development

:: Navigate to the script directory to ensure correct path references
CD /D "%~dp0"

:: Start the backend server in a new window
ECHO Starting Development Server...
:: Using call to ensure npx works properly
start "Jyotish Career Server" cmd /k "npx tsx watch server/_core/index.ts"

:: Wait for server to initialize (approx 8 seconds)
ECHO Waiting for server to initialize...
timeout /t 8 /nobreak >nul

:: Open the default web browser
ECHO Opening Application in Browser...
start http://localhost:3000

ECHO Done! You can minimize the Server window, but do not close it.
