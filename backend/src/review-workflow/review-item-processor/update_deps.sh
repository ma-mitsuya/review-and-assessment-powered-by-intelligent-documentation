#!/bin/bash
# Script to update dependencies using uv

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "uv not found. Installing..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
fi

echo "Updating dependencies with uv..."
uv pip install --upgrade --upgrade-package '*' -r requirements.txt

echo "Dependencies updated successfully!"