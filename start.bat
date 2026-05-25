@echo off
echo ===================================================
echo   MARSIL AI - SYSTEM INITIALIZATION
echo ===================================================
echo.

:: Check local dependencies
if not exist node_modules (
    echo Installing root dependencies...
    call npm install
)

if not exist backend\node_modules (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

if not exist frontend\node_modules (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo Starting Marsil Systems...
start /B npm start
timeout /t 4 /nobreak > nul
start http://localhost:5173

echo.
echo Marsil is running successfully!
echo Press Ctrl+C to stop.
pause
