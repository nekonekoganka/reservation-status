# Cloud Scheduler コスト最適化 設定手順書

## 概要

Cloud Runの実行頻度を時間帯・サービス別に最適化し、月額費用を削減します。

### 変更内容

| サービス | 時間帯 | 変更前 | 変更後 |
|---------|-------|-------|-------|
| 一般予約 | 7:00〜17:59 | 1分間隔 | 1分間隔（維持） |
| 一般予約 | 18:00〜翌6:59 | 1分間隔 | **5分間隔** |
| 視野予約 | 7:00〜17:59 | 1分間隔 | **3分間隔** |
| 視野予約 | 18:00〜翌6:59 | 1分間隔 | **10分間隔** |

### 期待される効果

| 項目 | 変更前 | 変更後 |
|-----|-------|-------|
| 一般予約 実行回数/日 | 1,440回 | 816回 |
| 視野予約 実行回数/日 | 1,440回 | 298回 |
| **合計** | **2,880回/日** | **1,114回/日（61%削減）** |
| **月額費用** | **¥4,500〜5,400** | **¥1,700〜2,100** |

**年間削減額: 約¥33,600〜39,600**

---

## 事前準備

1. Google Cloud Console を開く: https://console.cloud.google.com/
2. 右上の `Cloud Shell を有効にする` ボタンをクリック
3. プロジェクトを設定:

```bash
gcloud config set project forward-script-470815-c5
```

---

## Step 1: 現在のジョブを確認

```bash
gcloud scheduler jobs list --location=asia-northeast1
```

以下のジョブが表示されるはずです:
- `reservation-timeslot-checker-job`（一般予約・1分毎）
- `reservation-timeslot-checker-shiya-job`（視野予約・1分毎）
- `monthly-summary-general`（月次集計・月1回）
- `monthly-summary-shiya`（月次集計・月1回）

---

## Step 2: 既存ジョブの削除

```bash
# 一般予約用ジョブを削除
gcloud scheduler jobs delete reservation-timeslot-checker-job \
  --location=asia-northeast1 \
  --quiet

# 視野予約用ジョブを削除
gcloud scheduler jobs delete reservation-timeslot-checker-shiya-job \
  --location=asia-northeast1 \
  --quiet
```

---

## Step 3: 新しいジョブを作成（一般予約）

### 3-1. 診療時間帯（7:00〜17:59）- 1分間隔

```bash
gcloud scheduler jobs create http reservation-timeslot-checker-job-peak \
  --schedule="*/1 7-17 * * *" \
  --uri="https://timeslot-checker-224924651996.asia-northeast1.run.app/check" \
  --http-method=GET \
  --location=asia-northeast1 \
  --time-zone="Asia/Tokyo" \
  --description="一般予約チェック（7:00-17:59、1分毎）"
```

### 3-2. 診療時間外（18:00〜翌6:59）- 5分間隔

```bash
gcloud scheduler jobs create http reservation-timeslot-checker-job-offpeak \
  --schedule="*/5 0-6,18-23 * * *" \
  --uri="https://timeslot-checker-224924651996.asia-northeast1.run.app/check" \
  --http-method=GET \
  --location=asia-northeast1 \
  --time-zone="Asia/Tokyo" \
  --description="一般予約チェック（18:00-6:59、5分毎）"
```

---

## Step 4: 新しいジョブを作成（視野予約）

### 4-1. 診療時間帯（7:00〜17:59）- 3分間隔

```bash
gcloud scheduler jobs create http reservation-timeslot-checker-shiya-job-peak \
  --schedule="*/3 7-17 * * *" \
  --uri="https://timeslot-checker-shiya-224924651996.asia-northeast1.run.app/check" \
  --http-method=GET \
  --location=asia-northeast1 \
  --time-zone="Asia/Tokyo" \
  --description="視野予約チェック（7:00-17:59、3分毎）"
```

### 4-2. 診療時間外（18:00〜翌6:59）- 10分間隔

```bash
gcloud scheduler jobs create http reservation-timeslot-checker-shiya-job-offpeak \
  --schedule="*/10 0-6,18-23 * * *" \
  --uri="https://timeslot-checker-shiya-224924651996.asia-northeast1.run.app/check" \
  --http-method=GET \
  --location=asia-northeast1 \
  --time-zone="Asia/Tokyo" \
  --description="視野予約チェック（18:00-6:59、10分毎）"
```

---

## Step 5: 設定確認

```bash
# ジョブ一覧を表示
gcloud scheduler jobs list --location=asia-northeast1
```

以下の6つのジョブが表示されればOK:

| ジョブ名 | スケジュール | 説明 |
|---------|------------|------|
| `reservation-timeslot-checker-job-peak` | `*/1 7-17 * * *` | 一般・1分毎・7-17時 |
| `reservation-timeslot-checker-job-offpeak` | `*/5 0-6,18-23 * * *` | 一般・5分毎・18-6時 |
| `reservation-timeslot-checker-shiya-job-peak` | `*/3 7-17 * * *` | 視野・3分毎・7-17時 |
| `reservation-timeslot-checker-shiya-job-offpeak` | `*/10 0-6,18-23 * * *` | 視野・10分毎・18-6時 |
| `monthly-summary-general` | `0 1 1 * *` | 月次集計（変更なし） |
| `monthly-summary-shiya` | `0 1 1 * *` | 月次集計（変更なし） |

---

## Step 6: 動作テスト

```bash
# 一般予約（ピーク時間帯）
gcloud scheduler jobs run reservation-timeslot-checker-job-peak \
  --location=asia-northeast1

# 視野予約（ピーク時間帯）
gcloud scheduler jobs run reservation-timeslot-checker-shiya-job-peak \
  --location=asia-northeast1
```

実行後、Cloud Storageのデータが更新されたか確認:
```bash
gsutil cat gs://reservation-timeslots-fujiminohikari/timeslots.json
gsutil cat gs://reservation-timeslots-fujiminohikari/timeslots-shiya.json
```

---

## 完了！

設定変更が完了しました。翌日以降の請求画面で費用削減を確認してください。

---

## トラブルシューティング

### ジョブが実行されない場合

```bash
# ジョブの詳細を確認
gcloud scheduler jobs describe reservation-timeslot-checker-job-peak \
  --location=asia-northeast1
```

### Cloud RunのURLを確認する場合

```bash
gcloud run services describe timeslot-checker \
  --region=asia-northeast1 \
  --format='value(status.url)'

gcloud run services describe timeslot-checker-shiya \
  --region=asia-northeast1 \
  --format='value(status.url)'
```

### 元に戻す場合

```bash
# 新しいジョブを削除
gcloud scheduler jobs delete reservation-timeslot-checker-job-peak --location=asia-northeast1 --quiet
gcloud scheduler jobs delete reservation-timeslot-checker-job-offpeak --location=asia-northeast1 --quiet
gcloud scheduler jobs delete reservation-timeslot-checker-shiya-job-peak --location=asia-northeast1 --quiet
gcloud scheduler jobs delete reservation-timeslot-checker-shiya-job-offpeak --location=asia-northeast1 --quiet

# 元のジョブを再作成（1分毎・24時間）
gcloud scheduler jobs create http reservation-timeslot-checker-job \
  --schedule="*/1 * * * *" \
  --uri="https://timeslot-checker-224924651996.asia-northeast1.run.app/check" \
  --http-method=GET \
  --location=asia-northeast1 \
  --time-zone="Asia/Tokyo" \
  --description="予約時間枠チェック（1分毎）"

gcloud scheduler jobs create http reservation-timeslot-checker-shiya-job \
  --schedule="*/1 * * * *" \
  --uri="https://timeslot-checker-shiya-224924651996.asia-northeast1.run.app/check" \
  --http-method=GET \
  --location=asia-northeast1 \
  --time-zone="Asia/Tokyo" \
  --description="視野予約時間枠チェック（1分毎）"
```

---

## 参考: cron式の説明

| cron式 | 意味 |
|-------|------|
| `*/1 7-17 * * *` | 7時〜17時59分の間、毎分実行 |
| `*/3 7-17 * * *` | 7時〜17時59分の間、3分毎に実行 |
| `*/5 0-6,18-23 * * *` | 0時〜6時59分と18時〜23時59分の間、5分毎に実行 |
| `*/10 0-6,18-23 * * *` | 0時〜6時59分と18時〜23時59分の間、10分毎に実行 |

---

## 実行回数の内訳

### 一般予約
- 7:00〜17:59（11時間）: 1分間隔 = 11 × 60 = **660回/日**
- 18:00〜6:59（13時間）: 5分間隔 = 13 × 60 / 5 = **156回/日**
- **小計: 816回/日**

### 視野予約
- 7:00〜17:59（11時間）: 3分間隔 = 11 × 60 / 3 = **220回/日**
- 18:00〜6:59（13時間）: 10分間隔 = 13 × 60 / 10 = **78回/日**
- **小計: 298回/日**

### 合計: 1,114回/日（変更前: 2,880回/日）

---

**作成日**: 2026年1月9日
**更新日**: 2026年1月11日
**目的**: Cloud Run費用の最適化（月額約¥2,800〜3,300削減）

---

## 修正履歴

| 日付 | 内容 |
|-----|-----|
| 2026/1/9 | 初版作成 |
| 2026/1/10 | 初回設定実施（URLが間違っていた） |
| 2026/1/11 | 正しいURL（timeslot-checker-224924651996）で再設定、手順書を修正 |
| 2026/1/21 | 水曜日の日中を10分間隔に変更する手順を追加 |

---

## 追加最適化: 休診日（水曜日）の日中も10分間隔に変更

### 概要

水曜日は休診日のため、日中（7:00〜17:59）も夜間と同じ10分間隔でチェックするように変更します。

### 変更内容

| サービス | 時間帯 | 通常日 | **水曜日** |
|---------|-------|--------|-----------|
| 一般予約 | 7:00〜17:59 | 1分毎 | **10分毎** |
| 視野予約 | 7:00〜17:59 | 3分毎 | **10分毎** |

### Step 1: 現在のピーク時間帯ジョブを更新（水曜日を除外）

**統合版の場合:**

```bash
# 一般予約ピーク: 水曜日を除外
gcloud scheduler jobs update http timeslot-checker-unified-general-peak \
  --schedule="*/1 7-17 * * 0-2,4-6" \
  --location=asia-northeast1

# 視野予約ピーク: 水曜日を除外
gcloud scheduler jobs update http timeslot-checker-unified-shiya-peak \
  --schedule="*/3 7-17 * * 0-2,4-6" \
  --location=asia-northeast1
```

### Step 2: 水曜日の日中用ジョブを新規作成

**統合版の場合:**

```bash
# 一般予約・水曜日の日中（10分毎）
gcloud scheduler jobs create http timeslot-checker-unified-general-wed \
  --schedule="*/10 7-17 * * 3" \
  --uri="https://timeslot-checker-unified-224924651996.asia-northeast1.run.app/check?type=general" \
  --http-method=GET \
  --location=asia-northeast1 \
  --time-zone="Asia/Tokyo" \
  --description="一般予約チェック（水曜日7:00-17:59、10分毎）"

# 視野予約・水曜日の日中（10分毎）
gcloud scheduler jobs create http timeslot-checker-unified-shiya-wed \
  --schedule="*/10 7-17 * * 3" \
  --uri="https://timeslot-checker-unified-224924651996.asia-northeast1.run.app/check?type=shiya" \
  --http-method=GET \
  --location=asia-northeast1 \
  --time-zone="Asia/Tokyo" \
  --description="視野予約チェック（水曜日7:00-17:59、10分毎）"
```

### Step 3: 設定確認

```bash
gcloud scheduler jobs list --location=asia-northeast1
```

以下のジョブが表示されればOK:

| ジョブ名 | スケジュール | 説明 |
|---------|------------|------|
| `timeslot-checker-unified-general-peak` | `*/1 7-17 * * 0-2,4-6` | 一般・1分毎・水曜以外 |
| `timeslot-checker-unified-general-offpeak` | `*/5 0-6,18-23 * * *` | 一般・5分毎・夜間 |
| `timeslot-checker-unified-general-wed` | `*/10 7-17 * * 3` | 一般・10分毎・水曜日中 |
| `timeslot-checker-unified-shiya-peak` | `*/3 7-17 * * 0-2,4-6` | 視野・3分毎・水曜以外 |
| `timeslot-checker-unified-shiya-offpeak` | `*/10 0-6,18-23 * * *` | 視野・10分毎・夜間 |
| `timeslot-checker-unified-shiya-wed` | `*/10 7-17 * * 3` | 視野・10分毎・水曜日中 |

### cron式の説明

| cron式 | 意味 |
|-------|------|
| `*/1 7-17 * * 0-2,4-6` | 日〜火、木〜土の7時〜17時、毎分実行 |
| `*/10 7-17 * * 3` | 水曜日の7時〜17時、10分毎に実行 |
