#!/bin/bash

# Script to kill processes running on specific ports

PORT=${1:-5000}

echo "🔍 Checking for processes on port $PORT..."

# Find process using the port
PID=$(lsof -ti:$PORT)

if [ -z "$PID" ]; then
    echo "✅ No process found running on port $PORT"
else
    echo "🔄 Found process $PID running on port $PORT"
    echo "🛑 Killing process..."
    kill -9 $PID
    
    # Wait a moment and check again
    sleep 1
    
    NEW_PID=$(lsof -ti:$PORT)
    if [ -z "$NEW_PID" ]; then
        echo "✅ Successfully killed process on port $PORT"
    else
        echo "❌ Failed to kill process on port $PORT"
        exit 1
    fi
fi

echo "🚀 Port $PORT is now available"
