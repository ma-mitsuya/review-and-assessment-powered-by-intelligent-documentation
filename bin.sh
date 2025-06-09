#!/bin/bash
echo ""
echo "==========================================================================="
echo "  🚀 RAPID: Review & Assessment Powered by Intelligent Documentation        "
echo "---------------------------------------------------------------------------"
echo "  このスクリプトはRAPIDアプリケーションをCodeBuildを使用してデプロイします。"
echo "  ローカル環境に依存せず、AWSアカウント内でデプロイが完結します。          "
echo ""
echo "  ⚠️ 注意: デフォルトでは自動マイグレーションが有効になっています。       "
echo "     本番環境では --auto-migrate=false を指定することを検討してください。  "
echo "==========================================================================="
echo ""

# デフォルトパラメータ
ALLOWED_IPV4_RANGES='["0.0.0.0/1","128.0.0.0/1"]'
ALLOWED_IPV6_RANGES='["0000:0000:0000:0000:0000:0000:0000:0000/1","8000:0000:0000:0000:0000:0000:0000:0000/1"]'
DISABLE_IPV6="false"
AUTO_MIGRATE="true"
REPO_URL="https://github.com/aws-samples/review-and-assessment-powered-by-intelligent-documentation.git"
BRANCH="main"

# コマンドライン引数の解析
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --ipv4-ranges) ALLOWED_IPV4_RANGES="$2"; shift ;;
        --ipv6-ranges) ALLOWED_IPV6_RANGES="$2"; shift ;;
        --disable-ipv6) DISABLE_IPV6="true" ;;
        --auto-migrate) AUTO_MIGRATE="$2"; shift ;;
        --repo-url) REPO_URL="$2"; shift ;;
        --branch) BRANCH="$2"; shift ;;
        *) echo "不明なパラメータ: $1"; exit 1 ;;
    esac
    shift
done

# テンプレートの検証
aws cloudformation validate-template --template-body file://deploy.yml > /dev/null 2>&1
if [[ $? -ne 0 ]]; then
    echo "テンプレートの検証に失敗しました"
    exit 1
fi

StackName="RapidCodeBuildDeploy"

# CloudFormationスタックのデプロイ
aws cloudformation deploy \
  --stack-name $StackName \
  --template-file deploy.yml \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    AllowedIpV4AddressRanges="$ALLOWED_IPV4_RANGES" \
    AllowedIpV6AddressRanges="$ALLOWED_IPV6_RANGES" \
    DisableIpv6="$DISABLE_IPV6" \
    AutoMigrate="$AUTO_MIGRATE" \
    RepoUrl="$REPO_URL" \
    Branch="$BRANCH"

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
