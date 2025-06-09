#!/bin/bash
echo ""
echo "==========================================================================="
echo "  🚀 RAPID: Review & Assessment Powered by Intelligent Documentation        "
echo "---------------------------------------------------------------------------"
echo "  このスクリプトはRAPIDアプリケーションをCodeBuildを使用してデプロイします。"
echo "  S3バケットからコードを取得してデプロイします。                           "
echo ""
echo "  ⚠️ 注意: デフォルトでは自動マイグレーションが有効になっています。       "
echo "     本番環境では --auto-migrate=false を指定することを検討してください。  "
echo "==========================================================================="
echo ""

# プロジェクトのzipファイル作成とS3アップロード機能
create_and_upload_zip() {
  local s3_bucket="$1"
  local s3_key="$2"
  
  echo "プロジェクトのzipファイルを作成しています..."
  
  # プロジェクトディレクトリのルートに移動
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  cd "$SCRIPT_DIR"
  
  # 一時ディレクトリの作成
  TEMP_DIR=$(mktemp -d)
  PROJECT_DIR="$TEMP_DIR/rapid-project"
  mkdir -p "$PROJECT_DIR"
  
  # 除外するディレクトリとファイルのパターン
  EXCLUDE_PATTERNS=(
    "*/node_modules/*"
    "*/cdk.out/*"
    "*/.git/*"
    "*/dist/*"
    "*/build/*"
    "*/.next/*"
    "*/.cache/*"
    "*/.DS_Store"
    "*/coverage/*"
    "*/.env*"
    "*/*.log"
  )
  
  # 除外パターンを rsync 用に変換
  EXCLUDE_ARGS=""
  for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    # パターンから先頭の */ を削除
    clean_pattern=$(echo "$pattern" | sed 's|^\*/||')
    EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude=$clean_pattern"
  done
  
  # プロジェクトファイルを一時ディレクトリにコピー
  echo "プロジェクトファイルをコピー中..."
  rsync -a $EXCLUDE_ARGS --exclude=".git" --exclude="node_modules" --exclude="cdk.out" . "$PROJECT_DIR/"
  
  # 現在のディレクトリを一時ディレクトリに変更
  cd "$TEMP_DIR"
  
  # zip ファイルを作成
  echo "zipファイルを作成中: $s3_key"
  zip -r "$s3_key" rapid-project
  
  # S3 にアップロード
  echo "S3にアップロード中: s3://$s3_bucket/$s3_key"
  aws s3 cp "$s3_key" "s3://$s3_bucket/$s3_key"
  
  echo "アップロード完了: s3://$s3_bucket/$s3_key"
  
  # 一時ディレクトリに戻る
  cd "$SCRIPT_DIR"
  
  # 一時ファイルを削除
  rm -rf "$TEMP_DIR"
}

# デフォルトパラメータ
ALLOWED_IPV4_RANGES='["0.0.0.0/1","128.0.0.0/1"]'
ALLOWED_IPV6_RANGES='["0000:0000:0000:0000:0000:0000:0000:0000/1","8000:0000:0000:0000:0000:0000:0000:0000/1"]'
DISABLE_IPV6="false"
AUTO_MIGRATE="true"
# S3設定
S3_BUCKET=""
S3_KEY="rapid-code.zip"
BRANCH="main"
CREATE_ZIP="false"

# コマンドライン引数の解析
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --ipv4-ranges) ALLOWED_IPV4_RANGES="$2"; shift ;;
        --ipv6-ranges) ALLOWED_IPV6_RANGES="$2"; shift ;;
        --disable-ipv6) DISABLE_IPV6="true" ;;
        --auto-migrate) AUTO_MIGRATE="$2"; shift ;;
        --s3-bucket) S3_BUCKET="$2"; shift ;;
        --s3-key) S3_KEY="$2"; shift ;;
        --create-zip) CREATE_ZIP="true" ;;
        *) echo "不明なパラメータ: $1"; exit 1 ;;
    esac
    shift
done

# S3バケットの確認
if [[ -z "$S3_BUCKET" ]]; then
    echo "S3バケット名が指定されていません。--s3-bucket オプションで指定してください。"
    exit 1
fi

# zipファイルの作成とアップロードが指定されている場合
if [[ "$CREATE_ZIP" == "true" ]]; then
    create_and_upload_zip "$S3_BUCKET" "$S3_KEY"
fi

# S3オブジェクトの存在確認
aws s3 ls s3://$S3_BUCKET/$S3_KEY > /dev/null 2>&1
if [[ $? -ne 0 ]]; then
    echo "指定されたS3オブジェクトが存在しません: s3://$S3_BUCKET/$S3_KEY"
    exit 1
fi

echo "S3からコードを取得します: s3://$S3_BUCKET/$S3_KEY"

# テンプレートの検証
aws cloudformation validate-template --template-body file://deploy-s3.yml > /dev/null 2>&1
if [[ $? -ne 0 ]]; then
    echo "テンプレートの検証に失敗しました"
    exit 1
fi

StackName="RapidCodeBuildDeploy"

# CloudFormationスタックのデプロイ
aws cloudformation deploy \
  --stack-name $StackName \
  --template-file deploy-s3.yml \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    AllowedIpV4AddressRanges="$ALLOWED_IPV4_RANGES" \
    AllowedIpV6AddressRanges="$ALLOWED_IPV6_RANGES" \
    DisableIpv6="$DISABLE_IPV6" \
    AutoMigrate="$AUTO_MIGRATE" \
    S3Bucket="$S3_BUCKET" \
    S3Key="$S3_KEY"

echo "スタック作成の完了を待機中..."
echo "注意: このスタックにはCDKデプロイに使用されるCodeBuildプロジェクトが含まれています。"
spin='-\|/'
i=0
while true; do
    status=$(aws cloudformation describe-stacks --stack-name $StackName --query 'Stacks[0].StackStatus' --output text 2>/dev/null)
    if [[ "$status" == "CREATE_COMPLETE" || "$status" == "UPDATE_COMPLETE" || "$status" == "DELETE_COMPLETE" ]]; then
        break
    elif [[ "$status" == "ROLLBACK_COMPLETE" || "$status" == "DELETE_FAILED" || "$status" == "CREATE_FAILED" ]]; then
        echo "スタック作成に失敗しました。ステータス: $status"
        exit 1
    fi
    printf "\r${spin:i++%${#spin}:1}"
    sleep 1
done
echo -e "\n完了しました。\n"

outputs=$(aws cloudformation describe-stacks --stack-name $StackName --query 'Stacks[0].Outputs')
projectName=$(echo $outputs | jq -r '.[] | select(.OutputKey=="ProjectName").OutputValue')

if [[ -z "$projectName" ]]; then
    echo "CodeBuildプロジェクト名の取得に失敗しました"
    exit 1
fi

echo "CodeBuildプロジェクトを開始します: $projectName..."
buildId=$(aws codebuild start-build --project-name $projectName --query 'build.id' --output text)

if [[ -z "$buildId" ]]; then
    echo "CodeBuildプロジェクトの開始に失敗しました"
    exit 1
fi

echo "CodeBuildプロジェクトの完了を待機中..."
while true; do
    buildStatus=$(aws codebuild batch-get-builds --ids $buildId --query 'builds[0].buildStatus' --output text)
    if [[ "$buildStatus" == "SUCCEEDED" || "$buildStatus" == "FAILED" || "$buildStatus" == "STOPPED" ]]; then
        break
    fi
    sleep 10
done
echo "CodeBuildプロジェクトが完了しました。ステータス: $buildStatus"

if [[ "$buildStatus" != "SUCCEEDED" ]]; then
    echo "ビルドに失敗しました。ログを確認してください。"
    buildDetail=$(aws codebuild batch-get-builds --ids $buildId --query 'builds[0].logs.{groupName: groupName, streamName: streamName}' --output json)
    logGroupName=$(echo $buildDetail | jq -r '.groupName')
    logStreamName=$(echo $buildDetail | jq -r '.streamName')
    echo "ロググループ名: $logGroupName"
    echo "ログストリーム名: $logStreamName"
    echo "以下のコマンドでログを確認できます:"
    echo "aws logs get-log-events --log-group-name $logGroupName --log-stream-name $logStreamName"
    exit 1
fi

buildDetail=$(aws codebuild batch-get-builds --ids $buildId --query 'builds[0].logs.{groupName: groupName, streamName: streamName}' --output json)
logGroupName=$(echo $buildDetail | jq -r '.groupName')
logStreamName=$(echo $buildDetail | jq -r '.streamName')

echo "CDKデプロイのログを取得中..."
logs=$(aws logs get-log-events --log-group-name $logGroupName --log-stream-name $logStreamName)
frontendUrl=$(echo "$logs" | grep -o 'FrontendURL = [^ ]*' | cut -d' ' -f3 | tr -d '\n,')

echo ""
echo "==========================================================================="
echo "  🎉 デプロイが完了しました！                                              "
echo "---------------------------------------------------------------------------"
echo "  フロントエンドURL: $frontendUrl"
echo ""
echo "  ログの詳細は以下のコマンドで確認できます:"
echo "  aws logs get-log-events --log-group-name $logGroupName --log-stream-name $logStreamName"
echo "==========================================================================="
