#!/bin/bash

# ===================================================
#   MARSIL AI - SYSTEM INITIALIZATION (macOS/Linux)
# ===================================================

echo "==================================================="
echo "  MARSIL AI - SYSTEM INITIALIZATION"
echo "==================================================="
echo

# 1. Check root dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    npm install
fi

# 2. Check backend dependencies
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# 3. Check frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo "Starting Marsil Systems..."
npm start &

# Wait for Vite dev server to boot (4 seconds)
sleep 4

# Open default browser based on standard OS command
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:5173
elif command -v open > /dev/null; then
    open http://localhost:5173
fi

echo
echo "Marsil AI is running successfully!"
echo "Press Ctrl+C to stop."
wait
