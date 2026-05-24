@echo off
echo ===================================================
echo   MARSIL AI - SYSTEM SHUTDOWN
echo ===================================================
echo.
echo Killing all Marsil processes...

:: Kill Node.js (backend)
taskkill /F /IM node.exe /T 2>nul
echo [OK] Node.js processes terminated

:: Kill any remaining npm processes
taskkill /F /IM npm.cmd /T 2>nul

:: Free ports 3001 and 5173
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5174 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul

echo [OK] Ports 3001, 5173, 5174 freed
echo.
echo Marsil systems offline.
pause
