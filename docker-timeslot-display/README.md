# 予約時間枠表示システム（Docker版）

クリニック玄関用の予約時間枠表示システム。予約ページから具体的な空き時間枠を取得し、JSON APIとして提供します。

## 📋 概要

- **目的**: 「本日の空き予約時間枠」をリアルタイム表示
- **既存システムとの違い**: 「空きあり/満枠」の二択表示 → 「10:15・11:30・15:00」のように具体的な時間枠を表示
- **表示先**: クリニック玄関のPC（患者向け案内用）
- **更新頻度**: 1分毎（Cloud Schedulerで設定可能）

## 🏗️ システム構成

```
[Cloud Scheduler]
     ↓ (1分毎)
[Cloud Run: reservation-timeslot-checker]
     ↓ (Puppeteer)
[予約ページ: ChoiceRESERVE]
     ↓ (時間枠を抽出)
[/timeslots.json エンドポイント]
     ↓ (CORS対応)
[GitHub Pages: timeslot-display.html]
     ↓ (1分毎に自動更新)
[クリニック玄関のディスプレイ]
```

## 📁 ファイル構成

```
docker-timeslot-display/
├── server.js         # メインロジック（Puppeteer + Express.js）
├── package.json      # 依存関係
├── Dockerfile        # Docker設定
└── README.md         # このファイル
```

## 🚀 ローカルでのテスト

### 前提条件

- Node.js 18以上
- Docker Desktop（Dockerビルド用）

### 1. 依存関係のインストール

```bash
cd docker-timeslot-display
npm install
```

### 2. ローカルで実行

```bash
node server.js
```

### 3. ブラウザでアクセス

- **ヘルスチェック**: http://localhost:8080/
- **時間枠データ取得**: http://localhost:8080/timeslots.json
- **手動チェック実行**: http://localhost:8080/test
- **自動チェック実行**: http://localhost:8080/check

## 🐳 Dockerビルドとテスト

### 1. Dockerイメージをビルド

```bash
docker build -t reservation-timeslot-checker .
```

### 2. ローカルでDockerコンテナを実行

```bash
docker run -p 8080:8080 reservation-timeslot-checker
```

### 3. ブラウザでアクセス

http://localhost:8080/timeslots.json

## ☁️ Google Cloud Runへのデプロイ

### 前提条件

- Google Cloud CLIがインストール済み
- Google Cloudプロジェクト: `forward-script-470815-c5`
- 必要な権限: Cloud Run Admin, Artifact Registry Writer

### 1. Google Cloudにログイン

```bash
gcloud auth login
gcloud config set project forward-script-470815-c5
```

### 2. Artifact Registryにリポジトリを作成（初回のみ）

```bash
gcloud artifacts repositories create cloud-run-source-deploy \
  --repository-format=docker \
  --location=asia-northeast1 \
  --description="Docker repository for Cloud Run"
```

### 3. Dockerイメージをビルドしてプッシュ

```bash
# イメージをビルド
gcloud builds submit --tag asia-northeast1-docker.pkg.dev/forward-script-470815-c5/cloud-run-source-deploy/reservation-timeslot-checker
```

### 4. Cloud Runにデプロイ

```bash
gcloud run deploy reservation-timeslot-checker \
  --image asia-northeast1-docker.pkg.dev/forward-script-470815-c5/cloud-run-source-deploy/reservation-timeslot-checker \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 3 \
  --min-instances 0
```

### 5. デプロイ後のURL確認

```bash
gcloud run services describe reservation-timeslot-checker \
  --region asia-northeast1 \
  --format 'value(status.url)'
```

例: `https://reservation-timeslot-checker-XXXXX-an.a.run.app`

## ⏰ Cloud Schedulerの設定

### 1. Cloud Schedulerジョブを作成

```bash
gcloud scheduler jobs create http reservation-timeslot-checker-job \
  --schedule="*/1 * * * *" \
  --uri="https://reservation-timeslot-checker-XXXXX-an.a.run.app/check" \
  --http-method=GET \
  --location=asia-northeast1 \
  --time-zone="Asia/Tokyo" \
  --description="予約時間枠チェック（1分毎）"
```

**スケジュール設定:**
- `*/1 * * * *` - 1分毎に実行

### 2. ジョブの確認

```bash
gcloud scheduler jobs list --location=asia-northeast1
```

### 3. 手動でジョブを実行（テスト用）

```bash
gcloud scheduler jobs run reservation-timeslot-checker-job \
  --location=asia-northeast1
```

### 4. ログの確認

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=reservation-timeslot-checker" \
  --limit 50 \
  --format json
```

## 📊 API仕様

### GET /timeslots.json

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

### GET /check

Cloud Schedulerから呼ばれるエンドポイント。予約時間枠をチェックして `/timeslots.json` を更新します。

## 🏥 診療日判定ロジック

**診療時間内（10:30-18:30）:**
- 月曜・火曜・木曜・金曜・土曜・日曜 → 本日をチェック
- 水曜日 → 木曜をチェック

**診療時間外:**
- 火曜18:30以降 → 木曜をチェック
- その他18:30以降 → 翌診療日をチェック
- 月末18:30以降 → スキップ（手動入力）

## 🔧 トラブルシューティング

### 時間枠が取得できない

1. Cloud Runのログを確認:
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=reservation-timeslot-checker" \
  --limit 50
```

2. ローカルでテスト:
```bash
node server.js
# 別のターミナルで
curl http://localhost:8080/test
```

3. 予約ページのHTML構造が変更されていないか確認

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

## 💰 料金目安

- **Cloud Run**: 月額 約20〜80円（1分毎実行）
- **Cloud Scheduler**: 無料枠内（月3ジョブまで無料）
- **合計**: 月額 約20〜80円

## 📝 メンテナンス

### デプロイの更新

コードを変更した後:

```bash
# 1. ビルド＆プッシュ
gcloud builds submit --tag asia-northeast1-docker.pkg.dev/forward-script-470815-c5/cloud-run-source-deploy/reservation-timeslot-checker

# 2. 自動的にCloud Runが更新される（新しいリビジョンがデプロイされる）
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

## 🔗 関連リンク

- [既存システム（空き/満枠判定）](../docker-automation/)
- [表示用HTMLページ](../timeslot-display.html)
- [Google Cloud Run ドキュメント](https://cloud.google.com/run/docs)
- [Puppeteer ドキュメント](https://pptr.dev/)

## 📞 サポート

問題が発生した場合は、以下を確認してください:

1. Cloud Runのログ
2. Cloud Schedulerの実行履歴
3. 予約ページのHTML構造変更
4. ネットワーク接続

---

**作成日**: 2025年12月4日
**バージョン**: 1.0.0
**プロジェクト**: 予約時間枠表示システム
