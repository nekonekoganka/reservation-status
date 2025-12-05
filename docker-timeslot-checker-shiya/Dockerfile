# 公式の Puppeteer イメージを使用（Chromium と依存関係がすべて含まれる）
FROM ghcr.io/puppeteer/puppeteer:22.0.0

# rootユーザーで作業（ファイルコピーと権限設定のため）
USER root

# タイムゾーンを設定（root権限が必要）
ENV TZ=Asia/Tokyo
RUN apt-get update && \
    apt-get install -y --no-install-recommends tzdata && \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 作業ディレクトリを作成
WORKDIR /home/pptruser/app

# package.json と package-lock.json をコピー
COPY package*.json ./

# pptruser に所有権を変更
RUN chown -R pptruser:pptruser /home/pptruser/app

# pptruser に切り替え
USER pptruser

# Puppeteer は既にイメージに含まれているので、Puppeteer 以外の依存関係のみインストール
# --legacy-peer-deps を追加して依存関係の競合を回避
RUN npm install --omit=dev --legacy-peer-deps

# rootに戻してファイルコピー
USER root

# アプリケーションファイルをコピー
COPY server.js ./

# pptruser に所有権を変更
RUN chown -R pptruser:pptruser /home/pptruser/app

# 実行ユーザーを pptruser に設定
USER pptruser

# Cloud Storage バケット名を設定
ENV BUCKET_NAME=reservation-timeslots-fujiminohikari

# Cloud Run はポート 8080 を使用
ENV PORT=8080

# ポートを公開
EXPOSE 8080

# アプリケーションを起動
CMD ["node", "server.js"]
