# 予約時間枠表示システム（Cloud Storage対応）

クリニック玄関用の予約時間枠表示システム。予約ページから具体的な空き時間枠を取得し、Cloud Storageに保存します。

## 📋 概要

- **目的**: 「本日の空き予約時間枠」をリアルタイム表示
- **既存システムとの違い**: 「空きあり/満枠」の二択表示 → 「10:15・11:30・15:00」のように具体的な時間枠を表示
- **表示先**: クリニック玄関のPC（患者向け案内用）
- **更新頻度**: 1分毎（Cloud Schedulerで設定可能）
- **データ保存**: Cloud Storage（ステートレス設計）

## 🏗️ システム構成

```
[Cloud Scheduler]
     ↓ (1分毎)
[Cloud Run: reservation-timeslot-checker]
     ↓ (Puppeteer)
[予約ページ: ChoiceRESERVE]
     ↓ (時間枠を抽出)
[Cloud Storage: timeslots.json]
     ↓ (CORS対応・公開アクセス)
[GitHub Pages: timeslot-display.html]
     ↓ (1分毎に自動更新)
[クリニック玄関のディスプレイ]
```

## 📁 ファイル構成

```
docker-timeslot-checker/
├── server.js         # メインロジック（Puppeteer + Express.js + Cloud Storage）
├── package.json      # 依存関係（@google-cloud/storage を含む）
├── Dockerfile        # Docker設定
└── README.md         # このファイル
```

## 🚀 デプロイ手順（完全ガイド）

### Phase 1: Cloud Storageの設定

Cloud Shellで以下のコマンドを実行してください。

#### 1-1. バケットを作成

```bash
# バケット名
BUCKET_NAME="reservation-timeslots-fujiminohikari"

# バケットを作成（asia-northeast1リージョン）
gsutil mb -l asia-northeast1 gs://${BUCKET_NAME}
```

#### 1-2. CORS設定を適用

```bash
# CORS設定ファイルを作成
cat > cors.json << 'EOF'
[
  {
    "origin": ["*"],
    "method": ["GET"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

# CORS設定を適用
gsutil cors set cors.json gs://${BUCKET_NAME}
```

#### 1-3. 公開アクセスを設定

```bash
# バケットを公開アクセス可能に設定
gsutil iam ch allUsers:objectViewer gs://${BUCKET_NAME}
```

#### 1-4. 設定を確認

```bash
# CORS設定を確認
gsutil cors get gs://${BUCKET_NAME}

# IAM設定を確認
gsutil iam get gs://${BUCKET_NAME}
```

✅ **Phase 1 完了！** Cloud Storageの準備ができました。

---

### Phase 2: Cloud Runへのデプロイ

Cloud Shellで以下のコマンドを実行してください。

#### 2-1. GitHubからコードを取得

```bash
# ホームディレクトリに移動
cd ~

# リポジトリをクローン（既にクローン済みの場合はスキップ）
git clone https://github.com/nekonekoganka/reservation-status.git

# リポジトリに移動
cd reservation-status

# 最新のブランチをチェックアウト
git checkout claude/clinic-availability-display-01XKisWEjew81GBcm8VNKmM3

# 最新の変更を取得
git pull origin claude/clinic-availability-display-01XKisWEjew81GBcm8VNKmM3

# docker-timeslot-checker ディレクトリに移動
cd docker-timeslot-checker
```

#### 2-2. プロジェクトを設定

```bash
# プロジェクトIDを設定
gcloud config set project forward-script-470815-c5
```

#### 2-3. Cloud Runにデプロイ

```bash
# Cloud Runにデプロイ（ソースから直接ビルド）
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

**デプロイ完了までの時間**: 約5〜10分

#### 2-4. デプロイ後のURL確認

デプロイが完了すると、以下のようなメッセージが表示されます：

```
Service [reservation-timeslot-checker] revision [reservation-timeslot-checker-00001-xxx] has been deployed and is serving 100 percent of traffic.
Service URL: https://reservation-timeslot-checker-xxxxx-an.a.run.app
```

この **Service URL** をコピーしてください！

#### 2-5. 動作確認

```bash
# ヘルスチェック
curl https://reservation-timeslot-checker-xxxxx-an.a.run.app/

# テスト実行（時間枠をチェック）
curl https://reservation-timeslot-checker-xxxxx-an.a.run.app/test
```

✅ **Phase 2 完了！** Cloud Runへのデプロイが完了しました。

---

### Phase 3: Cloud Schedulerの設定

Cloud Shellで以下のコマンドを実行してください。

#### 3-1. Cloud Schedulerジョブを作成

```bash
# Cloud Run ServiceのURLを設定（Phase 2-4で確認したURL）
SERVICE_URL="https://reservation-timeslot-checker-xxxxx-an.a.run.app"

# Cloud Schedulerジョブを作成（1分毎に実行）
gcloud scheduler jobs create http reservation-timeslot-checker-job \
  --schedule="*/1 * * * *" \
  --uri="${SERVICE_URL}/check" \
  --http-method=GET \
  --location=asia-northeast1 \
  --time-zone="Asia/Tokyo" \
  --description="予約時間枠チェック（1分毎）"
```

**スケジュール設定:**
- `*/1 * * * *` - 1分毎に実行

#### 3-2. ジョブの確認

```bash
# ジョブ一覧を表示
gcloud scheduler jobs list --location=asia-northeast1
```

#### 3-3. 手動でジョブを実行（テスト用）

```bash
# 手動実行
gcloud scheduler jobs run reservation-timeslot-checker-job \
  --location=asia-northeast1
```

#### 3-4. Cloud Storageにファイルが作成されたか確認

```bash
# timeslots.json の内容を確認
gsutil cat gs://reservation-timeslots-fujiminohikari/timeslots.json

# または公開URLで確認
curl https://storage.googleapis.com/reservation-timeslots-fujiminohikari/timeslots.json
```

✅ **Phase 3 完了！** Cloud Schedulerの設定が完了しました。

---

## 🌐 公開URL

### JSON API（Cloud Storage）

```
https://storage.googleapis.com/reservation-timeslots-fujiminohikari/timeslots.json
```

このURLに直接アクセスすると、最新の時間枠データがJSON形式で取得できます。

### 表示用HTMLページ（GitHub Pages）

```
https://nekonekoganka.github.io/reservation-status/timeslot-display.html
```

このページにアクセスするだけで、最新の予約時間枠が表示されます。

---

## 📊 API仕様

### JSON形式

**レスポンス例（空きあり）:**

```json
{
  "date": 4,
  "displayText": "本日",
  "slots": ["10:15", "11:30", "15:00", "16:45"],
  "status": "available",
  "updatedAt": "2025-12-04T10:30:00.000Z"
}
```

**レスポンス例（満枠）:**

```json
{
  "date": 4,
  "displayText": "本日",
  "slots": [],
  "status": "full",
  "message": "満枠です",
  "updatedAt": "2025-12-04T10:30:00.000Z"
}
```

**レスポンス例（休診日）:**

```json
{
  "date": 4,
  "displayText": "木曜",
  "slots": [],
  "status": "closed",
  "message": "休診日です",
  "updatedAt": "2025-12-04T18:45:00.000Z"
}
```

---

## 🏥 診療日判定ロジック

**診療時間内（10:30-18:30）:**
- 月曜・火曜・木曜・金曜・土曜・日曜 → 本日をチェック
- 水曜日 → 木曜をチェック

**診療時間外:**
- 火曜18:30以降 → 木曜をチェック
- その他18:30以降 → 翌診療日をチェック
- 月末18:30以降 → スキップ（手動入力）

---

## 🔧 トラブルシューティング

### 時間枠が取得できない

1. **Cloud Runのログを確認**:
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=reservation-timeslot-checker" \
  --limit 50 \
  --format json
```

2. **Cloud Schedulerの実行履歴を確認**:
```bash
gcloud scheduler jobs describe reservation-timeslot-checker-job \
  --location=asia-northeast1
```

3. **Cloud Storageのファイルを確認**:
```bash
gsutil cat gs://reservation-timeslots-fujiminohikari/timeslots.json
```

### Cloud Runのメモリ不足

メモリを2Giに増やす:
```bash
gcloud run services update reservation-timeslot-checker \
  --memory 2Gi \
  --region asia-northeast1
```

### タイムアウトエラー

タイムアウトを600秒に延長:
```bash
gcloud run services update reservation-timeslot-checker \
  --timeout 600 \
  --region asia-northeast1
```

### Cloud Storageの権限エラー

Cloud Runサービスアカウントに権限を付与:
```bash
# サービスアカウントを確認
gcloud run services describe reservation-timeslot-checker \
  --region asia-northeast1 \
  --format 'value(spec.template.spec.serviceAccountName)'

# 権限を付与（必要に応じて）
gsutil iam ch serviceAccount:SERVICE_ACCOUNT_EMAIL:objectAdmin gs://reservation-timeslots-fujiminohikari
```

---

## 💰 料金目安

- **Cloud Run**: 月額 約20〜80円（1分毎実行）
- **Cloud Scheduler**: 無料枠内（月3ジョブまで無料）
- **Cloud Storage**: 無料枠内（1GB未満）
- **合計**: 月額 約20〜80円

---

## 📝 メンテナンス

### コードを更新した場合

```bash
# 1. GitHubの最新コードを取得
cd ~/reservation-status
git pull origin claude/clinic-availability-display-01XKisWEjew81GBcm8VNKmM3
cd docker-timeslot-checker

# 2. 再デプロイ
gcloud run deploy reservation-timeslot-checker \
  --source . \
  --platform managed \
  --region asia-northeast1
```

### Cloud Schedulerの停止・再開

```bash
# 停止
gcloud scheduler jobs pause reservation-timeslot-checker-job --location=asia-northeast1

# 再開
gcloud scheduler jobs resume reservation-timeslot-checker-job --location=asia-northeast1
```

### Cloud Runサービスの削除

```bash
gcloud run services delete reservation-timeslot-checker \
  --region asia-northeast1
```

### Cloud Schedulerジョブの削除

```bash
gcloud scheduler jobs delete reservation-timeslot-checker-job \
  --location=asia-northeast1
```

### Cloud Storageバケットの削除

```bash
gsutil rm -r gs://reservation-timeslots-fujiminohikari
```

---

## 🔗 関連リンク

- [既存システム（空き/満枠判定・一般予約）](../docker-automation/)
- [既存システム（空き/満枠判定・視野予約）](../docker-automation-shiya/)
- [表示用HTMLページ](../timeslot-display.html)
- [Google Cloud Run ドキュメント](https://cloud.google.com/run/docs)
- [Google Cloud Storage ドキュメント](https://cloud.google.com/storage/docs)
- [Puppeteer ドキュメント](https://pptr.dev/)

---

## 📞 サポート

問題が発生した場合は、以下を確認してください:

1. Cloud Runのログ
2. Cloud Schedulerの実行履歴
3. Cloud Storageのファイル内容
4. 予約ページのHTML構造変更
5. ネットワーク接続

---

**作成日**: 2025年12月4日
**バージョン**: 1.0.0
**プロジェクト**: 予約時間枠表示システム（Cloud Storage対応）
