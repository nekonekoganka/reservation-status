# Puppeteer を動かすための Node.js イメージ
FROM node:18-slim

# 作業ディレクトリを作成
WORKDIR /app

# Puppeteer が必要とするライブラリをインストール
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# package.json と package-lock.json をコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install --production

# アプリケーションファイルをコピー
COPY server.js ./

# Puppeteer が Chromium をダウンロードできるように環境変数を設定
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# タイムゾーンを Asia/Tokyo に設定
ENV TZ=Asia/Tokyo

# Cloud Run はポート 8080 を使用
ENV PORT=8080

# ポートを公開
EXPOSE 8080

# アプリケーションを起動
CMD ["node", "server.js"]
