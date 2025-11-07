# 公式の Puppeteer イメージを使用（Chromium と依存関係がすべて含まれる）
FROM ghcr.io/puppeteer/puppeteer:22.0.0

# 作業ディレクトリを変更
WORKDIR /home/pptruser/app

# package.json と package-lock.json をコピー
COPY package*.json ./

# Puppeteer は既にイメージに含まれているので、Puppeteer 以外の依存関係のみインストール
# --legacy-peer-deps を追加して依存関係の競合を回避
RUN npm install --omit=dev --legacy-peer-deps

# アプリケーションファイルをコピー
COPY server.js ./

# タイムゾーンを Asia/Tokyo に設定
ENV TZ=Asia/Tokyo

# Cloud Run はポート 8080 を使用
ENV PORT=8080

# ポートを公開
EXPOSE 8080

# アプリケーションを起動
CMD ["node", "server.js"]
