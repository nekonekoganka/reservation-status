# Cloud Run 更新デプロイ手順

コードを更新した後、Cloud Runに反映させる手順です。
**コピペするだけでOK！**

---

## 事前準備

1. Google Cloud Console を開く: https://console.cloud.google.com/
2. 右上の `Cloud Shell を有効にする` ボタンをクリック
3. Cloud Shell が起動したら、以下のコマンドを順番に実行

---

## Step 1: プロジェクト設定

```bash
gcloud config set project forward-script-470815-c5
```

---

## Step 2: コードを取得

```bash
cd ~
rm -rf reservation-status
git clone https://github.com/nekonekoganka/reservation-status.git
cd reservation-status
```

---

# 統合版デプロイ（推奨）

## Step 3: 統合版サービスをデプロイ

一般予約・視野予約を1つのサービスで処理する統合版です。
コスト削減のため、こちらを推奨します。

```bash
cd ~/reservation-status/docker-timeslot-checker-unified

gcloud run deploy reservation-timeslot-checker-unified \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 3 \
  --min-instances 0 \
  --set-env-vars BUCKET_NAME=reservation-timeslots-fujiminohikari
```

**所要時間**: 約5〜10分

途中で質問されたら `y` と入力してEnter

---

## Step 4: Cloud Scheduler を統合版に切り替え

### 4-1. 旧ジョブを削除

```bash
# 旧一般予約ジョブを削除
gcloud scheduler jobs delete reservation-timeslot-checker-job-peak --location=asia-northeast1 --quiet
gcloud scheduler jobs delete reservation-timeslot-checker-job-offpeak --location=asia-northeast1 --quiet

# 旧視野予約ジョブを削除
gcloud scheduler jobs delete reservation-timeslot-checker-shiya-job-peak --location=asia-northeast1 --quiet
gcloud scheduler jobs delete reservation-timeslot-checker-shiya-job-offpeak --location=asia-northeast1 --quiet

# 旧月次集計ジョブを削除
gcloud scheduler jobs delete monthly-summary-general --location=asia-northeast1 --quiet
gcloud scheduler jobs delete monthly-summary-shiya --location=asia-northeast1 --quiet
```

### 4-2. 統合版のジョブを作成

```bash
# 一般予約（ピーク時間帯 7:00-17:59、1分間隔）
gcloud scheduler jobs create http timeslot-checker-unified-general-peak \
  --schedule="*/1 7-17 * * *" \
  --uri="https://reservation-timeslot-checker-unified-224924651996.asia-northeast1.run.app/check?type=general" \
  --http-method=GET \
  --location=asia-northeast1 \
  --time-zone="Asia/Tokyo"

# 一般予約（オフピーク時間帯 18:00-6:59、5分間隔）
gcloud scheduler jobs create http timeslot-checker-unified-general-offpeak \
  --schedule="*/5 0-6,18-23 * * *" \
  --uri="https://reservation-timeslot-checker-unified-224924651996.asia-northeast1.run.app/check?type=general" \
  --http-method=GET \
  --location=asia-northeast1 \
  --time-zone="Asia/Tokyo"

# 視野予約（ピーク時間帯 7:00-17:59、3分間隔）
gcloud scheduler jobs create http timeslot-checker-unified-shiya-peak \
  --schedule="*/3 7-17 * * *" \
  --uri="https://reservation-timeslot-checker-unified-224924651996.asia-northeast1.run.app/check?type=shiya" \
  --http-method=GET \
  --location=asia-northeast1 \
  --time-zone="Asia/Tokyo"

# 視野予約（オフピーク時間帯 18:00-6:59、10分間隔）
gcloud scheduler jobs create http timeslot-checker-unified-shiya-offpeak \
  --schedule="*/10 0-6,18-23 * * *" \
  --uri="https://reservation-timeslot-checker-unified-224924651996.asia-northeast1.run.app/check?type=shiya" \
  --http-method=GET \
  --location=asia-northeast1 \
  --time-zone="Asia/Tokyo"

# 月次集計（毎月1日 01:00 JST）
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

---

## Step 5: 旧サービスを削除（オプション）

統合版が正常に動作することを確認後、旧サービスを削除してコストを削減できます。

```bash
# 旧サービスを削除
gcloud run services delete reservation-timeslot-checker --region=asia-northeast1 --quiet
gcloud run services delete reservation-timeslot-checker-shiya --region=asia-northeast1 --quiet
```

---

## 統合版の動作確認

```bash
# 一般予約のテスト
curl "https://reservation-timeslot-checker-unified-224924651996.asia-northeast1.run.app/test?type=general"

# 視野予約のテスト
curl "https://reservation-timeslot-checker-unified-224924651996.asia-northeast1.run.app/test?type=shiya"

# ヘルスチェック
curl "https://reservation-timeslot-checker-unified-224924651996.asia-northeast1.run.app/"
```

---

# 旧版デプロイ（非推奨）

以下は旧版（2サービス分離）のデプロイ手順です。
統合版の問題発生時のみ使用してください。

## 一般予約用をデプロイ

```bash
cd ~/reservation-status/docker-timeslot-checker

gcloud run deploy reservation-timeslot-checker \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 3 \
  --min-instances 0 \
  --set-env-vars BUCKET_NAME=reservation-timeslots-fujiminohikari
```

## 視野予約用をデプロイ

```bash
cd ~/reservation-status/docker-timeslot-checker-shiya

gcloud run deploy reservation-timeslot-checker-shiya \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 3 \
  --min-instances 0 \
  --set-env-vars BUCKET_NAME=reservation-timeslots-fujiminohikari
```

---

## トラブルシューティング

### 「APIが有効になっていません」と言われたら

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### デプロイに失敗したら

再度同じコマンドを実行してください。一時的なエラーの場合は再実行で成功します。

---

## コスト比較

| 構成 | Cloud Runサービス数 | Cloud Schedulerジョブ数 | 月額概算 |
|------|-------------------|----------------------|---------|
| 旧版（2サービス分離） | 2 | 6 | ¥2,000-2,500 |
| **統合版（推奨）** | 1 | 6 | ¥1,000-1,500 |

統合版により、Cold startコストが半減し、月額約¥500-1,000の削減が見込めます。

---

**作成日**: 2025年12月25日
**更新日**: 2026年1月15日（統合版追加）
