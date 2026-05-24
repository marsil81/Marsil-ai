@echo off
echo ===================================================
echo   MARSIL AI - SYSTEM INITIALIZATION
echo ===================================================
echo.

if not exist node_modules (
    echo Installing root dependencies...
    call npm install
)

call claude --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Claude Code not found. Installing globally in the background...
    start /B npm install -g @anthropic-ai/claude-code
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

:: Start servers in background, then open browser after delay
start /B npm start
timeout /t 3 /nobreak > nul
start http://localhost:5173

echo.
echo Marsil is running! Browser should open automatically.
echo Press Ctrl+C to stop.
pause
