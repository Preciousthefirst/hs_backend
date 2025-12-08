#!/bin/bash

# 🎮 Hangout Spots Backend - Gamification System
# Startup script

echo "🚀 Starting Hangout Spots Backend with Gamification..."
echo ""

# Kill any existing node processes on port 3000
echo "🧹 Cleaning up existing processes..."
pkill -f "node app.js" 2>/dev/null || true
sleep 1

# Check if port 3000 is available
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 3000 is still in use. Trying to free it..."
    kill $(lsof -t -i:3000) 2>/dev/null || true
    sleep 2
fi

echo ""
echo "✅ Starting server..."
echo ""

# Start the server
node app.js

# If the script is interrupted, clean up
trap "echo ''; echo '🛑 Shutting down...'; pkill -f 'node app.js'; exit 0" INT TERM




