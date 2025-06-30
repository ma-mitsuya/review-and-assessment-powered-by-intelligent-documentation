#!/bin/bash
# Poetry dependency lock and requirements.txt generation script for Python Lambda functions

set -e

# 使用方法を表示する関数
show_usage() {
    echo "Usage: $0 <python-lambda-directory>"
    echo ""
    echo "Examples:"
    echo "  $0 cdk/lib/constructs/mcp-runtime/python"
    echo "  $0 backend/src/review-workflow/review-item-processor"
    echo ""
    echo "This script will:"
    echo "  1. Update Poetry lock file (poetry.lock)"
    echo "  2. Export locked requirements to requirements-locked.txt"
}

# 引数チェック
if [ $# -eq 0 ]; then
    echo "❌ Error: Python Lambda directory path is required"
    echo ""
    show_usage
    exit 1
fi

PYTHON_DIR="$1"

# ディレクトリの存在確認
if [ ! -d "$PYTHON_DIR" ]; then
    echo "❌ Error: Directory '$PYTHON_DIR' does not exist"
    exit 1
fi

# pyproject.tomlの存在確認
if [ ! -f "$PYTHON_DIR/pyproject.toml" ]; then
    echo "❌ Error: pyproject.toml not found in '$PYTHON_DIR'"
    echo "This directory does not appear to be a Poetry project"
    exit 1
fi

echo "🔄 Updating Python requirements for: $PYTHON_DIR"
echo ""

# 指定されたディレクトリに移動
cd "$PYTHON_DIR"

echo "📍 Working directory: $(pwd)"
echo "🔄 Updating Poetry lock file..."
poetry lock

echo "📦 Exporting locked requirements..."
poetry export -f requirements.txt --output requirements-locked.txt --without-hashes

# ローカルwheelファイルの絶対パスを相対パスに修正し、URLエンコードもデコード
if [ -f "requirements-locked.txt" ]; then
    # @ file://で始まる絶対パスを相対パスに変換し、URLエンコードをデコード
    sed -i.bak -e 's|^[^[:space:]]* @ file:///.*/\([^/]*\.whl\)|./\1|g' -e 's|%2B|+|g' requirements-locked.txt
    rm -f requirements-locked.txt.bak
fi

echo ""
echo "✅ Requirements updated successfully!"
echo "📄 Locked requirements saved to: $PYTHON_DIR/requirements-locked.txt"