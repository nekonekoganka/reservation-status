# 視野予約状況自動チェックシステム（Docker版）

Node.js + Puppeteer で視野予約ページを自動チェックし、Google Cloud Run にデプロイするシステムです。

## 📌 概要

- **対象ページ:** 視野予約（fujiminohikari）
- **実行方式:** Cloud Scheduler + Cloud Run
- **実行頻度:** 営業時間中1分ごと、営業時間外5分ごと
- **コスト:** 月20〜80円程度（ほぼ無料枠内）
- **ベースコード:** chrome-extension/content.js のロジックを移植
- **スプレッドシート:** `フォームの回答_視野予約`

---

## 🗂️ ファイル構成

```
docker-automation-shiya/
├── server.js          # メインコード（Node.js + Express + Puppeteer）
├── package.json       # 依存関係
├── Dockerfile         # Docker設定
├── .env.example       # 環境変数の例
└── README.md          # このファイル
```

---

## 🚀 Chromebook（Cloud Shell）でのデプロイ手順

### 前提条件

- Google Cloud アカウント
- Google Cloud プロジェクト
  - **プロジェクト番号:** 224924651996
  - **プロジェクト ID:** forward-script-470815-c5
- 課金の有効化（無料枠でも課金設定が必要）
- 視野予約専用のGoogle Apps Script URL

---

### ステップ0: Google Apps Script のセットアップ

1. Google Apps Scriptエディタを開く
   - https://script.google.com/
2. 新しいプロジェクトを作成
3. `gas/google-apps-script-shiya.js` のコードをコピー
4. 「デプロイ」→「新しいデプロイ」
   - 種類: ウェブアプリ
   - 実行ユーザー: 自分
   - アクセスできるユーザー: 全員
5. デプロイ後、Web App URLをコピー
   - 例: `https://script.google.com/macros/s/AKfycby.../exec`

---

### ステップ1: Cloud Shell を開く

1. Chromebook で Google Cloud Console を開く
   - https://console.cloud.google.com/
2. 右上のターミナルアイコン「Cloud Shell をアクティブにする」をクリック
3. Cloud Shell が起動します

---

### ステップ2: リポジトリをクローン

```bash
# GitHubリポジトリをクローン
git clone https://github.com/nekonekoganka/reservation-status.git
cd reservation-status/docker-automation-shiya
```

**🔧 トラブルシューティング:**

もし `cd reservation-status/docker-automation-shiya` で以下のエラーが出た場合：
```bash
-bash: cd: reservation-status/docker-automation-shiya: No such file or directory
```

これは、クローンしたリポジトリが古いバージョンの可能性があります。以下のコマンドで最新のコードを取得してください：
```bash
cd ~/reservation-status
git pull origin main
cd docker-automation-shiya
```

**または、既にクローン済みの場合は削除して再クローン：**
```bash
cd ~
rm -rf reservation-status
git clone https://github.com/nekonekoganka/reservation-status.git
cd reservation-status/docker-automation-shiya
```

---

### ステップ3: Google Cloud の設定

```bash
# プロジェクトIDを設定
export PROJECT_ID="forward-script-470815-c5"
gcloud config set project $PROJECT_ID

# プロジェクト情報を確認
# プロジェクト番号: 224924651996
# プロジェクト ID: forward-script-470815-c5

# リージョンを設定（東京リージョン推奨）
export REGION="asia-northeast1"

# 必要なAPIを有効化（既に有効化済みの場合はスキップされます）
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable cloudscheduler.googleapis.com
```

---

### ステップ4: 環境変数を設定

```bash
# 視野予約専用GAS の URL を環境変数に設定
# ※ステップ0で取得したURLを使用
export GAS_URL="https://script.google.com/macros/s/YOUR_SHIYA_GAS_URL_HERE/exec"

# 視野予約ページのURL
export RESERVATION_URL="https://ckreserve.com/clinic/fujiminohikari-ganka/fujiminohikari"
```

---

### ステップ4.5: ビルド前の確認

Dockerイメージをビルドする前に、必要なファイルが存在するか確認します。
```bash
# 現在のディレクトリの確認
pwd

# ファイル一覧を表示
ls -la
```

**確認ポイント:** 以下のファイルが表示されることを確認してください：
- ✅ Dockerfile
- ✅ server.js
- ✅ package.json
- ✅ README.md
- ✅ .env.example

もしこれらのファイルが表示されない場合は、ステップ2に戻って正しいディレクトリ（`docker-automation-shiya`）に移動してください。

---

### ステップ5: Docker イメージをビルドして Cloud Run にデプロイ

```bash
# Cloud Build でイメージをビルド
gcloud builds submit --tag gcr.io/$PROJECT_ID/reservation-checker-shiya .

# Cloud Run にデプロイ
gcloud run deploy reservation-checker-shiya \
  --image gcr.io/$PROJECT_ID/reservation-checker-shiya \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_APPS_SCRIPT_URL=$GAS_URL,RESERVATION_URL=$RESERVATION_URL \
  --memory 1Gi \
  --timeout 60s \
  --max-instances 1 \
  --min-instances 0
```

デプロイが完了すると、Cloud Run の URL が表示されます。

**例:**
```
Service [reservation-checker-shiya] revision [reservation-checker-shiya-00001-abc] has been deployed and is serving 100 percent of traffic.
Service URL: https://reservation-checker-shiya-xxxxxxxxxx-an.a.run.app
```

この URL をメモしておきます。

---

### ステップ6: 動作確認（手動テスト）

```bash
# Cloud Run の URL を取得
export SERVICE_URL=$(gcloud run services describe reservation-checker-shiya \
  --platform managed \
  --region $REGION \
  --format 'value(status.url)')

echo "Service URL: $SERVICE_URL"

# テストエンドポイントを実行
curl "$SERVICE_URL/test"
```

正常に動作すれば、JSON形式で結果が返ってきます。

---

### ステップ7: Cloud Scheduler を設定（営業時間ベース）

営業時間中は1分ごと、営業時間外は5分ごとに実行するため、3つのジョブを作成します。

```bash
# ジョブ1: 営業時間中（月火木金土日 9:00-18:59）1分ごと
gcloud scheduler jobs create http reservation-checker-shiya-business-hours \
  --location $REGION \
  --schedule "* 9-18 * * 0-2,4-6" \
  --uri "$SERVICE_URL/check" \
  --http-method GET \
  --time-zone "Asia/Tokyo" \
  --description "視野予約：営業時間中（1分ごと）"

# ジョブ2: 営業時間外（深夜・早朝）5分ごと
gcloud scheduler jobs create http reservation-checker-shiya-off-hours \
  --location $REGION \
  --schedule "*/5 0-8,19-23 * * *" \
  --uri "$SERVICE_URL/check" \
  --http-method GET \
  --time-zone "Asia/Tokyo" \
  --description "視野予約：営業時間外（5分ごと）"

# ジョブ3: 水曜日（休診日）5分ごと
gcloud scheduler jobs create http reservation-checker-shiya-wednesday \
  --location $REGION \
  --schedule "*/5 * * * 3" \
  --uri "$SERVICE_URL/check" \
  --http-method GET \
  --time-zone "Asia/Tokyo" \
  --description "視野予約：水曜日・休診日（5分ごと）"
```

**スケジュール設定の説明:**
- `* 9-18 * * 0-2,4-6` = 月火木金土日の9時-18時台、毎分
- `*/5 0-8,19-23 * * *` = 毎日0-8時と19-23時、5分ごと
- `*/5 * * * 3` = 水曜日全時間帯、5分ごと

**実行頻度:**
- 営業時間中（約208時間/月）: **1分ごと** = 12,480回/月
- 営業時間外（約512時間/月）: **5分ごと** = 6,144回/月
- **合計: 約18,600回/月**
- **月額料金: 20〜80円程度**

---

### ステップ8: Cloud Scheduler を手動実行してテスト

```bash
# 営業時間中のジョブを手動実行
gcloud scheduler jobs run reservation-checker-shiya-business-hours --location $REGION

# または、営業時間外のジョブを手動実行
gcloud scheduler jobs run reservation-checker-shiya-off-hours --location $REGION

# ログを確認
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=reservation-checker-shiya" \
  --limit 50 \
  --format json

# 全ジョブの一覧を確認
gcloud scheduler jobs list --location $REGION
```

---

## 🔧 ローカルでの開発・テスト

### 前提条件

- Node.js 18以上
- Docker（オプション）

### 手順

```bash
# 1. 依存関係をインストール
npm install

# 2. .env ファイルを作成
cp .env.example .env

# 3. .env ファイルを編集（環境変数を設定）
nano .env

# 4. ローカルで実行
npm start

# 5. 別のターミナルでテスト
curl http://localhost:8080/test
```

### Docker でテスト

```bash
# イメージをビルド
docker build -t reservation-checker-shiya .

# コンテナを実行
docker run -p 8080:8080 \
  -e GOOGLE_APPS_SCRIPT_URL="YOUR_SHIYA_GAS_URL" \
  -e RESERVATION_URL="https://ckreserve.com/clinic/fujiminohikari-ganka/fujiminohikari" \
  reservation-checker-shiya

# テスト
curl http://localhost:8080/test
```

---

## 📊 コスト概算

### 実行頻度（営業時間ベース）

- **営業時間中:** 1分ごと（月火木金土日 9:00-18:59）
- **営業時間外:** 5分ごと（深夜・早朝・水曜日）
- **月間実行回数:** 約18,600回

### Cloud Run

- リクエスト数: 約18,600回/月
- 実行時間: 1回あたり約10秒
- CPU時間: 約51.7時間/月（無料枠50時間をわずかに超過）
- メモリ: 1GB
- **月額: 20〜60円**

### Cloud Scheduler

- ジョブ数: 3個（営業時間中、営業時間外、水曜日）
- **月額: 無料**（月3ジョブまで無料）

### Cloud Build

- ビルド時間: 初回のみ約5分
- **月額: ほぼ無料**（月120分まで無料）

**合計: 月20〜80円程度**

**注:** 一般予約システムと合わせて2つのCloud Runサービスを稼働させると、合計で月40〜160円程度になります。

---

## 🛠️ トラブルシューティング

### 0. リポジトリのクローン後にディレクトリが見つからない

**エラー:**
```bash
-bash: cd: reservation-status/docker-automation-shiya: No such file or directory
```

**原因:**
- クローンしたリポジトリが古いバージョン
- `docker-automation-shiya`ディレクトリが存在しない

**解決方法:**
```bash
cd ~/reservation-status
git pull origin main
cd docker-automation-shiya
```

---

### 1. デプロイに失敗する

```bash
# ログを確認
gcloud builds log --region=$REGION

# API が有効化されているか確認
gcloud services list --enabled
```

### 2. Cloud Scheduler が動かない

```bash
# ジョブのステータスを確認
gcloud scheduler jobs describe reservation-checker-shiya-business-hours --location $REGION

# 手動実行してログを確認
gcloud scheduler jobs run reservation-checker-shiya-business-hours --location $REGION
```

### 3. Puppeteer がエラーになる

- メモリ不足の可能性 → `--memory 1Gi` を `2Gi` に増やす
- タイムアウト → `--timeout 60s` を `120s` に増やす

```bash
# Cloud Run の設定を更新
gcloud run services update reservation-checker-shiya \
  --region $REGION \
  --memory 2Gi \
  --timeout 120s
```

---

## 📝 メンテナンス

### コードを更新してデプロイ

```bash
# リポジトリを更新
cd reservation-status/docker-automation-shiya
git pull

# 再ビルド・再デプロイ
gcloud builds submit --tag gcr.io/$PROJECT_ID/reservation-checker-shiya .
gcloud run deploy reservation-checker-shiya \
  --image gcr.io/$PROJECT_ID/reservation-checker-shiya \
  --platform managed \
  --region $REGION
```

### ログを確認

```bash
# 最新50件のログを表示
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=reservation-checker-shiya" \
  --limit 50 \
  --format json

# リアルタイムでログを監視
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=reservation-checker-shiya"
```

### Cloud Scheduler のスケジュールを変更

```bash
# 既存のジョブを全て削除
gcloud scheduler jobs delete reservation-checker-shiya-business-hours --location $REGION
gcloud scheduler jobs delete reservation-checker-shiya-off-hours --location $REGION
gcloud scheduler jobs delete reservation-checker-shiya-wednesday --location $REGION

# 新しいスケジュールで再作成（例: 営業時間中2分ごと、営業時間外5分ごと）
gcloud scheduler jobs create http reservation-checker-shiya-business-hours \
  --location $REGION \
  --schedule "*/2 9-18 * * 0-2,4-6" \
  --uri "$SERVICE_URL/check" \
  --http-method GET \
  --time-zone "Asia/Tokyo" \
  --description "視野予約：営業時間中（2分ごと）"

gcloud scheduler jobs create http reservation-checker-shiya-off-hours \
  --location $REGION \
  --schedule "*/5 0-8,19-23 * * *" \
  --uri "$SERVICE_URL/check" \
  --http-method GET \
  --time-zone "Asia/Tokyo" \
  --description "視野予約：営業時間外（5分ごと）"

gcloud scheduler jobs create http reservation-checker-shiya-wednesday \
  --location $REGION \
  --schedule "*/5 * * * 3" \
  --uri "$SERVICE_URL/check" \
  --http-method GET \
  --time-zone "Asia/Tokyo" \
  --description "視野予約：水曜日・休診日（5分ごと）"
```

---

## 🔒 セキュリティ

### Cloud Run の認証を有効化（推奨）

```bash
# 認証を有効化
gcloud run services update reservation-checker-shiya \
  --region $REGION \
  --no-allow-unauthenticated

# Cloud Scheduler のサービスアカウントに権限を付与
# プロジェクト番号: 224924651996
gcloud run services add-iam-policy-binding reservation-checker-shiya \
  --region $REGION \
  --member="serviceAccount:224924651996-compute@developer.gserviceaccount.com" \
  --role="roles/run.invoker"
```

---

## 📞 サポート

問題が発生した場合は、GitHubの Issuesで報告してください。

---

## ✅ チェックリスト

デプロイ前に確認：

- [ ] Google Apps Script（視野予約専用）を作成・デプロイした
- [ ] GAS URL を取得した
- [ ] スプレッドシートに「フォームの回答_視野予約」シートを作成した
- [ ] Google Cloud プロジェクトを確認した
- [ ] Cloud Shell を開いた
- [ ] リポジトリをクローンした
- [ ] 環境変数を設定した
- [ ] Cloud Run にデプロイした
- [ ] 手動テストが成功した
- [ ] Cloud Scheduler を設定した
- [ ] スプレッドシートにデータが記録された

---

**作成日:** 2025年11月14日
**バージョン:** 1.0.0（視野予約システム初版）
**対応環境:** Chromebook (Cloud Shell), Linux, macOS
