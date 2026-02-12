# Cloud Run統合版デプロイ作業ガイド

## 背景・目的

現在、予約チェッカーが2つの別サービスとして稼働中。これを1つに統合してコスト削減する。

| 項目 | 現在 | 統合後 |
|------|------|--------|
| Cloud Runサービス数 | 2 | 1 |
| 月額コスト | 約¥2,250（75円/日） | 約¥1,050-1,500（35-50円/日） |

---

## 現在の構成

### Cloud Runサービス（2つ）
- `reservation-timeslot-checker` - 一般予約用
- `reservation-timeslot-checker-shiya` - 視野予約用

### Cloud Schedulerジョブ（6つ）
- `reservation-timeslot-checker-job-peak` - 一般ピーク（1分間隔）
- `reservation-timeslot-checker-job-offpeak` - 一般オフピーク（5分間隔）
- `reservation-timeslot-checker-shiya-job-peak` - 視野ピーク（3分間隔）
- `reservation-timeslot-checker-shiya-job-offpeak` - 視野オフピーク（10分間隔）
- `monthly-summary-general` - 一般月次集計
- `monthly-summary-shiya` - 視野月次集計

---

## 作業手順

### 準備
1. Google Cloud Console を開く: https://console.cloud.google.com/
2. 右上の「Cloud Shell を有効にする」をクリック

### Step 1: プロジェクト設定

```bash
gcloud config set project forward-script-470815-c5
```

### Step 2: コード取得

```bash
cd ~
rm -rf reservation-status
git clone https://github.com/nekonekoganka/reservation-status.git
cd reservation-status
```

### Step 3: 統合版をデプロイ

```bash
cd ~/reservation-status/docker-timeslot-checker-unified

gcloud run deploy reservation-timeslot-checker-unified \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --no-allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 3 \
  --min-instances 0 \
  --set-env-vars BUCKET_NAME=reservation-timeslots-fujiminohikari
```

所要時間: 約5〜10分。質問されたら `y` と入力。

> **重要:** `--no-allow-unauthenticated` を必ず指定してください。認証なしアクセスを防ぎます。

### Step 4: 動作確認

```bash
# 一般予約のテスト
curl "https://reservation-timeslot-checker-unified-224924651996.asia-northeast1.run.app/test?type=general"

# 視野予約のテスト
curl "https://reservation-timeslot-checker-unified-224924651996.asia-northeast1.run.app/test?type=shiya"
```

両方とも `"success": true` が返ればOK。

### Step 5: 旧Cloud Schedulerジョブを削除

```bash
gcloud scheduler jobs delete reservation-timeslot-checker-job-peak --location=asia-northeast1 --quiet
gcloud scheduler jobs delete reservation-timeslot-checker-job-offpeak --location=asia-northeast1 --quiet
gcloud scheduler jobs delete reservation-timeslot-checker-shiya-job-peak --location=asia-northeast1 --quiet
gcloud scheduler jobs delete reservation-timeslot-checker-shiya-job-offpeak --location=asia-northeast1 --quiet
gcloud scheduler jobs delete monthly-summary-general --location=asia-northeast1 --quiet
gcloud scheduler jobs delete monthly-summary-shiya --location=asia-northeast1 --quiet
```

### Step 6: 新Cloud Schedulerジョブを作成

```bash
# 一般予約（ピーク 7:00-17:59、1分間隔）
gcloud scheduler jobs create http timeslot-checker-unified-general-peak \
  --schedule="*/1 7-17 * * *" \
  --uri="https://reservation-timeslot-checker-unified-224924651996.asia-northeast1.run.app/check?type=general" \
  --http-method=GET \
  --location=asia-northeast1 \
  --time-zone="Asia/Tokyo"

# 一般予約（オフピーク 18:00-6:59、5分間隔）
gcloud scheduler jobs create http timeslot-checker-unified-general-offpeak \
  --schedule="*/5 0-6,18-23 * * *" \
  --uri="https://reservation-timeslot-checker-unified-224924651996.asia-northeast1.run.app/check?type=general" \
  --http-method=GET \
  --location=asia-northeast1 \
  --time-zone="Asia/Tokyo"

# 視野予約（ピーク 7:00-17:59、3分間隔）
gcloud scheduler jobs create http timeslot-checker-unified-shiya-peak \
  --schedule="*/3 7-17 * * *" \
  --uri="https://reservation-timeslot-checker-unified-224924651996.asia-northeast1.run.app/check?type=shiya" \
  --http-method=GET \
  --location=asia-northeast1 \
  --time-zone="Asia/Tokyo"

# 視野予約（オフピーク 18:00-6:59、10分間隔）
gcloud scheduler jobs create http timeslot-checker-unified-shiya-offpeak \
  --schedule="*/10 0-6,18-23 * * *" \
  --uri="https://reservation-timeslot-checker-unified-224924651996.asia-northeast1.run.app/check?type=shiya" \
  --http-method=GET \
  --location=asia-northeast1 \
  --time-zone="Asia/Tokyo"

# 月次集計（毎月1日 01:00）
gcloud scheduler jobs create http monthly-summary-unified \
  --schedule="0 1 1 * *" \
  --uri="https://reservation-timeslot-checker-unified-224924651996.asia-northeast1.run.app/generate-monthly-summary?type=general" \
  --http-method=GET \
  --location=asia-northeast1 \
  --time-zone="Asia/Tokyo"

gcloud scheduler jobs create http monthly-summary-unified-shiya \
  --schedule="5 1 1 * *" \
  --uri="https://reservation-timeslot-checker-unified-224924651996.asia-northeast1.run.app/generate-monthly-summary?type=shiya" \
  --http-method=GET \
  --location=asia-northeast1 \
  --time-zone="Asia/Tokyo"
```

### Step 7: Schedulerの動作確認

```bash
# ジョブ一覧を確認
gcloud scheduler jobs list --location=asia-northeast1

# 手動でジョブを実行してテスト
gcloud scheduler jobs run timeslot-checker-unified-general-peak --location=asia-northeast1
gcloud scheduler jobs run timeslot-checker-unified-shiya-peak --location=asia-northeast1
```

### Step 8: 旧サービスを削除（動作確認後）

統合版が正常に動いていることを確認したら、旧サービスを削除してコスト削減。

```bash
gcloud run services delete reservation-timeslot-checker --region=asia-northeast1 --quiet
gcloud run services delete reservation-timeslot-checker-shiya --region=asia-northeast1 --quiet
```

---

## Cloud Run 認証設定

Cloud Run は認証必須に設定されています。Cloud Scheduler からの正規リクエストのみが許可されます。

### 現在の設定

- Cloud Run: `allUsers` の `run.invoker` 権限を削除済み（認証なしアクセスは 403 Forbidden）
- Cloud Scheduler: OIDC トークン認証を使用
- サービスアカウント: `224924651996-compute@developer.gserviceaccount.com`（Cloud Run Invoker 権限付き）

### 認証の仕組み

```
Cloud Scheduler
  → OIDC トークンを自動付与
    → Cloud Run がトークンを検証
      → 正規リクエストのみ処理
```

HTML ページ・Android アプリ・Chrome 拡張は Cloud Storage から直接データを読むため、この認証の影響を受けません。

### 再デプロイ時の注意

Cloud Run を再デプロイする場合は `--no-allow-unauthenticated` を指定してください。
Cloud Shell の gcloud バージョンによっては非対応の場合があるため、デプロイ後に `allUsers` 権限を手動で削除する方法でも対応可能です：

```bash
# デプロイ（--no-allow-unauthenticated が使える場合）
gcloud run deploy reservation-timeslot-checker-unified \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --no-allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 3 \
  --min-instances 0 \
  --set-env-vars BUCKET_NAME=reservation-timeslots-fujiminohikari

# 上記で --no-allow-unauthenticated がエラーになる場合は、
# --allow-unauthenticated でデプロイ後に以下で権限を削除：
gcloud run services remove-iam-policy-binding reservation-timeslot-checker-unified \
  --region=asia-northeast1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

### 新しい Scheduler ジョブを追加する場合

OIDC 認証オプションを必ず付けてください：

```bash
gcloud scheduler jobs create http <ジョブ名> \
  --schedule="<cron式>" \
  --uri="https://reservation-timeslot-checker-unified-224924651996.asia-northeast1.run.app/<エンドポイント>" \
  --http-method=GET \
  --location=asia-northeast1 \
  --time-zone="Asia/Tokyo" \
  --oidc-service-account-email=224924651996-compute@developer.gserviceaccount.com \
  --oidc-token-audience=https://reservation-timeslot-checker-unified-224924651996.asia-northeast1.run.app
```

### 認証を一括で再設定する場合

```bash
bash secure-cloudrun.sh
```

---

## 確認ポイント

### Cloud Storageのデータが更新されているか
- https://storage.googleapis.com/reservation-timeslots-fujiminohikari/timeslots.json
- https://storage.googleapis.com/reservation-timeslots-fujiminohikari/timeslots-shiya.json

### ダッシュボードが正常に動作しているか
- https://nekonekoganka.github.io/reservation-status/dashboard.html

---

## トラブルシューティング

### 「APIが有効になっていません」と言われたら
```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable cloudscheduler.googleapis.com
```

### デプロイに失敗したら
再度同じコマンドを実行。一時的なエラーの場合は再実行で成功する。

### Schedulerジョブが既に存在すると言われたら
```bash
gcloud scheduler jobs delete [ジョブ名] --location=asia-northeast1 --quiet
```
で削除してから再作成。

---

## 統合版の仕組み

- 1つのCloud Runサービスで一般・視野両方を処理
- URLパラメータ `?type=general` / `?type=shiya` で切り替え
- Cloud Schedulerの頻度設定は従来通り（一般1分/視野3分など）
- 出力先のCloud Storageファイルも従来と同じ

---

## 作業完了後の構成

### Cloud Runサービス（1つ）
- `reservation-timeslot-checker-unified`

### Cloud Schedulerジョブ（6つ）
- `timeslot-checker-unified-general-peak`
- `timeslot-checker-unified-general-offpeak`
- `timeslot-checker-unified-shiya-peak`
- `timeslot-checker-unified-shiya-offpeak`
- `monthly-summary-unified`
- `monthly-summary-unified-shiya`
