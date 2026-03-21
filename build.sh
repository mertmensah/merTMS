#!/usr/bin/env bash
# Build script for Render deployment

set -o errexit

echo "Installing Python dependencies..."
pip install --upgrade pip

# Install with only binary packages (no source builds that require Rust/compilers)
pip install --only-binary=:all: -r backend/requirements.txt || \
  pip install -r backend/requirements.txt --prefer-binary

echo "Build completed successfully!"
