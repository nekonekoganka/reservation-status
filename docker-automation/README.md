# 予約状況自動チェックシステム（Docker版）

Node.js + Puppeteer で予約ページを自動チェックし、Google Cloud Run にデプロイするシステムです。

## 📌 概要

- **実行方式:** Cloud Scheduler + Cloud Run（方式A）
- **実行頻度:** 営業時間中1分ごと、営業時間外5分ごと
- **コスト:** 月20〜80円程度（ほぼ無料枠内）
- **ベースコード:** chrome-extension/content.js のロジックを移植

---

## 🗂️ ファイル構成

```
docker-automation/
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
- Google Cloud プロジェクト（既存または新規）
- 課金の有効化（無料枠でも課金設定が必要）

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
cd reservation-status/docker-automation
```

---

### ステップ3: Google Cloud の設定

```bash
# プロジェクトIDを確認（まだ作成していない場合は作成）
gcloud projects list

# プロジェクトIDを設定（YOUR_PROJECT_ID を実際のIDに置き換える）
export PROJECT_ID="YOUR_PROJECT_ID"
gcloud config set project $PROJECT_ID

# リージョンを設定（東京リージョン推奨）
export REGION="asia-northeast1"

# 必要なAPIを有効化
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable cloudscheduler.googleapis.com
```

---

### ステップ4: 環境変数を設定

```bash
# GAS の URL を環境変数に設定
export GAS_URL="https://script.google.com/macros/s/AKfycbzIRL1XS4zVAwcAs8OKMhVDR-eC_amv2GPMW5-Y8dYr_UsA92-CZIAwKJvSyxWsAEDz/exec"

# 予約ページのURL
export RESERVATION_URL="https://ckreserve.com/clinic/fujiminohikari-ganka"
```

---

### ステップ5: Docker イメージをビルドして Cloud Run にデプロイ

```bash
# Cloud Build でイメージをビルド
gcloud builds submit --tag gcr.io/$PROJECT_ID/reservation-checker .

# Cloud Run にデプロイ
gcloud run deploy reservation-checker \
  --image gcr.io/$PROJECT_ID/reservation-checker \
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
Service [reservation-checker] revision [reservation-checker-00001-abc] has been deployed and is serving 100 percent of traffic.
Service URL: https://reservation-checker-xxxxxxxxxx-an.a.run.app
```

この URL をメモしておきます。

---

### ステップ6: 動作確認（手動テスト）

```bash
# Cloud Run の URL を取得
export SERVICE_URL=$(gcloud run services describe reservation-checker \
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
gcloud scheduler jobs create http reservation-checker-business-hours \
  --location $REGION \
  --schedule "* 9-18 * * 0-2,4-6" \
  --uri "$SERVICE_URL/check" \
  --http-method GET \
  --time-zone "Asia/Tokyo" \
  --description "営業時間中（1分ごと）"

# ジョブ2: 営業時間外（深夜・早朝）5分ごと
gcloud scheduler jobs create http reservation-checker-off-hours \
  --location $REGION \
  --schedule "*/5 0-8,19-23 * * *" \
  --uri "$SERVICE_URL/check" \
  --http-method GET \
  --time-zone "Asia/Tokyo" \
  --description "営業時間外（5分ごと）"

# ジョブ3: 水曜日（休診日）5分ごと
gcloud scheduler jobs create http reservation-checker-wednesday \
  --location $REGION \
  --schedule "*/5 * * * 3" \
  --uri "$SERVICE_URL/check" \
  --http-method GET \
  --time-zone "Asia/Tokyo" \
  --description "水曜日・休診日（5分ごと）"
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
gcloud scheduler jobs run reservation-checker-business-hours --location $REGION

# または、営業時間外のジョブを手動実行
gcloud scheduler jobs run reservation-checker-off-hours --location $REGION

# ログを確認
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=reservation-checker" \
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
docker build -t reservation-checker .

# コンテナを実行
docker run -p 8080:8080 \
  -e GOOGLE_APPS_SCRIPT_URL="YOUR_GAS_URL" \
  -e RESERVATION_URL="https://ckreserve.com/clinic/fujiminohikari-ganka" \
  reservation-checker

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

---

## 🛠️ トラブルシューティング

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
gcloud scheduler jobs describe reservation-checker-job --location $REGION

# 手動実行してログを確認
gcloud scheduler jobs run reservation-checker-job --location $REGION
```

### 3. Puppeteer がエラーになる

- メモリ不足の可能性 → `--memory 1Gi` を `2Gi` に増やす
- タイムアウト → `--timeout 60s` を `120s` に増やす

```bash
# Cloud Run の設定を更新
gcloud run services update reservation-checker \
  --region $REGION \
  --memory 2Gi \
  --timeout 120s
```

---

## 📝 メンテナンス

### コードを更新してデプロイ

```bash
# リポジトリを更新
cd reservation-status/docker-automation
git pull

# 再ビルド・再デプロイ
gcloud builds submit --tag gcr.io/$PROJECT_ID/reservation-checker .
gcloud run deploy reservation-checker \
  --image gcr.io/$PROJECT_ID/reservation-checker \
  --platform managed \
  --region $REGION
```

### ログを確認

```bash
# 最新50件のログを表示
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=reservation-checker" \
  --limit 50 \
  --format json

# リアルタイムでログを監視
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=reservation-checker"
```

### Cloud Scheduler のスケジュールを変更

```bash
# 既存のジョブを全て削除
gcloud scheduler jobs delete reservation-checker-business-hours --location $REGION
gcloud scheduler jobs delete reservation-checker-off-hours --location $REGION
gcloud scheduler jobs delete reservation-checker-wednesday --location $REGION

# 新しいスケジュールで再作成（例: 営業時間中2分ごと、営業時間外5分ごと）
gcloud scheduler jobs create http reservation-checker-business-hours \
  --location $REGION \
  --schedule "*/2 9-18 * * 0-2,4-6" \
  --uri "$SERVICE_URL/check" \
  --http-method GET \
  --time-zone "Asia/Tokyo" \
  --description "営業時間中（2分ごと）"

gcloud scheduler jobs create http reservation-checker-off-hours \
  --location $REGION \
  --schedule "*/5 0-8,19-23 * * *" \
  --uri "$SERVICE_URL/check" \
  --http-method GET \
  --time-zone "Asia/Tokyo" \
  --description "営業時間外（5分ごと）"

gcloud scheduler jobs create http reservation-checker-wednesday \
  --location $REGION \
  --schedule "*/5 * * * 3" \
  --uri "$SERVICE_URL/check" \
  --http-method GET \
  --time-zone "Asia/Tokyo" \
  --description "水曜日・休診日（5分ごと）"
```

---

## 🔒 セキュリティ

### Cloud Run の認証を有効化（推奨）

```bash
# 認証を有効化
gcloud run services update reservation-checker \
  --region $REGION \
  --no-allow-unauthenticated

# Cloud Scheduler のサービスアカウントに権限を付与
gcloud run services add-iam-policy-binding reservation-checker \
  --region $REGION \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/run.invoker"
```

---

## 📞 サポート

問題が発生した場合は、GitHubの Issuesで報告してください。

---

## ✅ チェックリスト

デプロイ前に確認：

- [ ] Google Cloud プロジェクトを作成した
- [ ] 課金を有効化した
- [ ] Cloud Shell を開いた
- [ ] リポジトリをクローンした
- [ ] 環境変数を設定した
- [ ] Cloud Run にデプロイした
- [ ] 手動テストが成功した
- [ ] Cloud Scheduler を設定した
- [ ] スプレッドシートにデータが記録された

---

**作成日:** 2025年11月7日
**最終更新:** 2025年11月9日
**バージョン:** 1.1.0（営業時間ベース実行対応）
**対応環境:** Chromebook (Cloud Shell), Linux, macOS
