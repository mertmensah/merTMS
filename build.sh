#!/usr/bin/env bash
# Build script for Render deployment

set -o errexit

echo "Checking Python version..."
# Try python3.11 first, fallback to python3
if command -v python3.11 &> /dev/null; then
    PYTHON_CMD=python3.11
elif command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
else
    PYTHON_CMD=python
fi

echo "Using Python: $PYTHON_CMD"
$PYTHON_CMD --version

echo "Installing Python dependencies..."
$PYTHON_CMD -m pip install --upgrade pip
$PYTHON_CMD -m pip install -r backend/requirements.txt --prefer-binary

echo "Build completed successfully!"
