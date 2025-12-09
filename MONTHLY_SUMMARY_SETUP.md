# 月次集計機能 実装手順書

## 概要

この機能は、ダッシュボードで1年間などの長期データを表示する際の
パフォーマンスを最適化するために、月次集計ファイルを自動生成するものです。

### 効果
- **従来**: 1年分のデータ表示に730回のHTTPリクエスト（365日 × 2種別）
- **最適化後**: 約24回のHTTPリクエスト（12ヶ月 × 2種別 + 当月分の日次）

---

## 実装内容

### 1. Cloud Run サービスへの追加エンドポイント

#### 一般予約用 (`docker-timeslot-checker/server.js`)
- `GET /generate-monthly-summary` - 前月の月次集計を生成
- `GET /generate-all-monthly-summaries` - 過去12ヶ月分を一括生成（初回用）

#### 視野検査用 (`docker-timeslot-checker-shiya/server.js`)
- 同様のエンドポイントを追加

### 2. 保存先
- 一般予約: `gs://reservation-timeslots-fujiminohikari/monthly-summary/general/YYYY-MM.json`
- 視野検査: `gs://reservation-timeslots-fujiminohikari/monthly-summary/shiya/YYYY-MM.json`

### 3. ダッシュボード (`dashboard.html`)
- 60日以上の期間選択時に月次サマリーを自動利用

---

## デプロイ手順

### Step 1: Cloud Run サービスの再デプロイ

```bash
# 一般予約用
cd docker-timeslot-checker
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/timeslot-checker
gcloud run deploy timeslot-checker \
  --image gcr.io/YOUR_PROJECT_ID/timeslot-checker \
  --platform managed \
  --region asia-northeast1

# 視野検査用
cd ../docker-timeslot-checker-shiya
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/timeslot-checker-shiya
gcloud run deploy timeslot-checker-shiya \
  --image gcr.io/YOUR_PROJECT_ID/timeslot-checker-shiya \
  --platform managed \
  --region asia-northeast1
```

### Step 2: 過去データの月次集計を一括生成（初回のみ）

デプロイ後、ブラウザまたはcurlで以下にアクセス：

```bash
# 一般予約用
curl https://YOUR_CLOUD_RUN_URL/generate-all-monthly-summaries

# 視野検査用
curl https://YOUR_SHIYA_CLOUD_RUN_URL/generate-all-monthly-summaries
```

成功すると、以下のようなレスポンスが返ります：
```json
{
  "success": true,
  "generatedMonths": ["2024-06", "2024-07", ...],
  "message": "10ヶ月分の月次集計を生成しました"
}
```

### Step 3: Cloud Scheduler の設定

毎月1日の深夜に前月の集計を自動生成するジョブを設定：

```bash
# 一般予約用
gcloud scheduler jobs create http monthly-summary-general \
  --schedule="0 1 1 * *" \
  --uri="https://YOUR_CLOUD_RUN_URL/generate-monthly-summary" \
  --http-method=GET \
  --time-zone="Asia/Tokyo" \
  --location=asia-northeast1

# 視野検査用
gcloud scheduler jobs create http monthly-summary-shiya \
  --schedule="0 1 1 * *" \
  --uri="https://YOUR_SHIYA_CLOUD_RUN_URL/generate-monthly-summary" \
  --http-method=GET \
  --time-zone="Asia/Tokyo" \
  --location=asia-northeast1
```

### Step 4: ダッシュボードの更新

静的ファイル（dashboard.html）を更新：

```bash
gsutil cp dashboard.html gs://reservation-timeslots-fujiminohikari/
```

---

## 動作確認

1. ダッシュボードを開く
2. 「3ヶ月」または「1年」ボタンをクリック
3. ブラウザのコンソール（F12）で以下のログを確認：
   ```
   月次サマリー使用: Xヶ月 + 日次Y日
   ```

---

## トラブルシューティング

### 月次サマリーが取得できない場合
1. Cloud Storageの`monthly-summary/`フォルダを確認
2. `/generate-all-monthly-summaries`を再実行

### データが表示されない場合
1. ブラウザキャッシュをクリア
2. 日次データ(`history/`)が存在することを確認

---

## ファイル構成

```
monthly-summary/
├── general/
│   ├── 2024-06.json
│   ├── 2024-07.json
│   └── ...
└── shiya/
    ├── 2024-06.json
    ├── 2024-07.json
    └── ...
```

### 月次サマリーのJSON形式

```json
{
  "yearMonth": "2024-12",
  "type": "general",
  "generatedAt": "2025-01-01T01:00:00.000Z",
  "totalDays": 31,
  "daysWithData": 28,
  "dailyData": {
    "2024-12-01": {
      "entries": [
        {"time": "02:00", "availableSlots": 15},
        {"time": "07:00", "availableSlots": 12},
        ...
      ]
    },
    ...
  }
}
```
