#!/bin/bash
# Update all Python Lambda functions' requirements

set -e

echo "🔄 Updating all Python Lambda functions' requirements..."
echo ""

# Python Lambda関数のディレクトリリスト
PYTHON_DIRS=(
    "cdk/lib/constructs/mcp-runtime/python"
    "backend/src/review-workflow/review-item-processor"
)

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UPDATE_SCRIPT="$SCRIPT_DIR/update-python-requirements.sh"

# 各ディレクトリを処理
for dir in "${PYTHON_DIRS[@]}"; do
    echo "📦 Processing: $dir"
    "$UPDATE_SCRIPT" "$dir"
    echo ""
done

echo "✅ All Python Lambda functions' requirements updated successfully!"