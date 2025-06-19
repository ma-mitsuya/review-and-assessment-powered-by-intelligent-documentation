FROM node:22
# Lambda Web Adapter を追加
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.0 /lambda-adapter /opt/extensions/lambda-adapter

WORKDIR /var/task
COPY package*.json ./
COPY prisma ./prisma

RUN ["npm","ci","--omit=dev"]
COPY . .
RUN ["npm","run","build"]

# 環境変数の設定
ENV PORT=8080
ENV AWS_LWA_READINESS_CHECK_PATH=/health
ENV AWS_LWA_ASYNC_INIT=false
ENV AWS_LWA_ENABLE_COMPRESSION=false

# アプリケーションの起動
CMD ["node", "dist/api/index.js"]
