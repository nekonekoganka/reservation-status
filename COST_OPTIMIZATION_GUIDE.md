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

## 現在のジョブを確認

```bash
gcloud scheduler jobs list --location=asia-northeast1
```

以下のジョブが表示されるはずです:
- `timeslot-checker-unified-general-morning`（一般予約・午前1分毎）
- `timeslot-checker-unified-general-afternoon`（一般予約・午後2分毎）
- `timeslot-checker-unified-general-offpeak`（一般予約・夜間5分毎）
- `timeslot-checker-unified-general-wed`（一般予約・水曜10分毎）
- `timeslot-checker-unified-shiya-daytime`（視野予約・日中5分毎）
- `timeslot-checker-unified-shiya-offpeak`（視野予約・夜間10分毎）
- `timeslot-checker-unified-shiya-wed`（視野予約・水曜10分毎）
- `monthly-summary-unified`（月次集計・一般）
- `monthly-summary-unified-shiya`（月次集計・視野）

---

> **注意:** 旧版（2サービス分離）の手順は統合版への移行完了に伴い削除しました。
> 統合版の設定手順は [DEPLOY_UNIFIED_SERVICE.md](DEPLOY_UNIFIED_SERVICE.md) を参照してください。
> Cloud Run URL: `https://reservation-timeslot-checker-unified-224924651996.asia-northeast1.run.app`

---

## トラブルシューティング

### ジョブが実行されない場合

```bash
# ジョブの詳細を確認
gcloud scheduler jobs describe timeslot-checker-unified-general-morning \
  --location=asia-northeast1
```

### Cloud RunのURLを確認する場合

```bash
gcloud run services describe reservation-timeslot-checker-unified \
  --region=asia-northeast1 \
  --format='value(status.url)'
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
| 2026/1/22 | **Cloud Scheduler設定変更を実施完了**（水曜日対応） |
| 2026/1/22 | 一般予約（午後2分/17時以降5分）・視野予約（日中5分）の最適化手順を追加 |
| 2026/1/22 | **追加最適化2 設定変更を実施完了**（年間約5,900円削減） |

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
  --uri="https://reservation-timeslot-checker-unified-224924651996.asia-northeast1.run.app/check?type=general" \
  --http-method=GET \
  --location=asia-northeast1 \
  --time-zone="Asia/Tokyo" \
  --description="一般予約チェック（水曜日7:00-17:59、10分毎）"

# 視野予約・水曜日の日中（10分毎）
gcloud scheduler jobs create http timeslot-checker-unified-shiya-wed \
  --schedule="*/10 7-17 * * 3" \
  --uri="https://reservation-timeslot-checker-unified-224924651996.asia-northeast1.run.app/check?type=shiya" \
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

---

## 追加最適化2: 一般予約（午後・夜間）と視野予約（日中）の間隔変更

### 概要

コスト削減のため、以下の変更を行います：
- 一般予約: 午後（13-16時）を2分間隔、17時以降を5分間隔に変更
- 視野予約: 日中（7-17時）を5分間隔に変更

### 変更内容

**一般予約（水曜以外）:**

| 時間帯 | 変更前 | 変更後 |
|--------|-------|--------|
| 7:00〜12:59 | 1分毎 | 1分毎（変更なし） |
| 13:00〜16:59 | 1分毎 | **2分毎** |
| 17:00〜6:59 | 1分/5分 | **5分毎** |

**視野予約（水曜以外）:**

| 時間帯 | 変更前 | 変更後 |
|--------|-------|--------|
| 7:00〜17:59 | 3分毎 | **5分毎** |
| 18:00〜6:59 | 10分毎 | 10分毎（変更なし） |

### 期待される効果

| 項目 | 変更前 | 変更後 | 削減 |
|------|-------|--------|------|
| 一般予約/日 | 816回 | 648回 | 168回 |
| 視野予約/日 | 298回 | 210回 | 88回 |
| **月額コスト** | **約2,181円** | **約1,689円** | **約492円** |
| **年間削減** | | | **約5,900円** |

### Step 1: 既存ジョブの削除

```bash
# 一般予約の既存ピークジョブを削除
gcloud scheduler jobs delete timeslot-checker-unified-general-peak \
  --location=asia-northeast1 --quiet

# 視野予約の既存ピークジョブを削除
gcloud scheduler jobs delete timeslot-checker-unified-shiya-peak \
  --location=asia-northeast1 --quiet
```

### Step 2: 一般予約の新ジョブを作成

```bash
# 一般予約・午前（7-12時、1分毎、水曜除く）
gcloud scheduler jobs create http timeslot-checker-unified-general-morning \
  --schedule="*/1 7-12 * * 0-2,4-6" \
  --uri="https://reservation-timeslot-checker-unified-224924651996.asia-northeast1.run.app/check?type=general" \
  --http-method=GET \
  --location=asia-northeast1 \
  --time-zone="Asia/Tokyo" \
  --description="一般予約チェック（午前7:00-12:59、1分毎、水曜除く）"

# 一般予約・午後（13-16時、2分毎、水曜除く）
gcloud scheduler jobs create http timeslot-checker-unified-general-afternoon \
  --schedule="*/2 13-16 * * 0-2,4-6" \
  --uri="https://reservation-timeslot-checker-unified-224924651996.asia-northeast1.run.app/check?type=general" \
  --http-method=GET \
  --location=asia-northeast1 \
  --time-zone="Asia/Tokyo" \
  --description="一般予約チェック（午後13:00-16:59、2分毎、水曜除く）"

# 一般予約・夜間（17-6時、5分毎）を更新
gcloud scheduler jobs update http timeslot-checker-unified-general-offpeak \
  --schedule="*/5 0-6,17-23 * * *" \
  --location=asia-northeast1
```

### Step 3: 視野予約の日中ジョブを更新

```bash
# 視野予約・日中（7-17時、5分毎、水曜除く）
gcloud scheduler jobs create http timeslot-checker-unified-shiya-daytime \
  --schedule="*/5 7-17 * * 0-2,4-6" \
  --uri="https://reservation-timeslot-checker-unified-224924651996.asia-northeast1.run.app/check?type=shiya" \
  --http-method=GET \
  --location=asia-northeast1 \
  --time-zone="Asia/Tokyo" \
  --description="視野予約チェック（日中7:00-17:59、5分毎、水曜除く）"
```

### Step 4: 設定確認

```bash
gcloud scheduler jobs list --location=asia-northeast1
```

以下のジョブが表示されればOK:

| ジョブ名 | スケジュール | 説明 |
|---------|------------|------|
| `timeslot-checker-unified-general-morning` | `*/1 7-12 * * 0-2,4-6` | 一般・1分毎・午前 |
| `timeslot-checker-unified-general-afternoon` | `*/2 13-16 * * 0-2,4-6` | 一般・2分毎・午後 |
| `timeslot-checker-unified-general-offpeak` | `*/5 0-6,17-23 * * *` | 一般・5分毎・夜間 |
| `timeslot-checker-unified-general-wed` | `*/10 7-17 * * 3` | 一般・10分毎・水曜 |
| `timeslot-checker-unified-shiya-daytime` | `*/5 7-17 * * 0-2,4-6` | 視野・5分毎・日中 |
| `timeslot-checker-unified-shiya-offpeak` | `*/10 0-6,18-23 * * *` | 視野・10分毎・夜間 |
| `timeslot-checker-unified-shiya-wed` | `*/10 7-17 * * 3` | 視野・10分毎・水曜 |
