# 予約状況自動更新システム

眼科クリニック（ふじみ野ひかり眼科）の予約状況を自動判定し、ホームページや複数デバイスに表示するシステム。一般予約と視野予約の2種類を独立管理。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express, Puppeteer 21.6.0 |
| Storage | Google Cloud Storage (JSON) |
| Infrastructure | Docker, Google Cloud Run |
| Hosting | GitHub Pages |
| Automation | Cloud Scheduler |
| Extensions | Chrome Extension (Manifest V3) |
| Mobile | Android (Kotlin 2.0, OkHttp) |

## ディレクトリ構造

```
reservation-status/
├── *.html                              # GitHub Pages フロントエンド
├── docker-timeslot-checker-unified/    # Cloud Run 統合版（メイン使用）
├── docker-timeslot-checker/            # 一般予約用（旧版）
├── docker-timeslot-checker-shiya/      # 視野予約用（旧版）
├── chrome-extension-timeslot-general/  # Chrome拡張（一般）
├── chrome-extension-timeslot-shiya/    # Chrome拡張（視野）
├── chrome-extension-auto-reload/       # 自動リロード拡張
├── android-reservation-status/         # Androidアプリ
└── docs/                               # ドキュメント
```

## 主要ファイル

### Frontend (GitHub Pages)
- `timeslot-status-checker.html` - メインの予約状況チェッカー（スマホ/壁掛け2モード）
- `dashboard.html` - 予約傾向分析ダッシュボード
- `timeslot-banner.html` - iframe埋め込み用バナー
- `timeslot-display.html` / `timeslot-display-shiya.html` - 詳細表示
- `entrance-display.html` - 玄関ディスプレイ用

### Backend (Cloud Run)
- `docker-timeslot-checker-unified/server.js` - 統合版メインロジック（Puppeteerでスクレイピング）

## Cloud Storage データ形式

```json
{
  "date": 5,
  "displayText": "本日",
  "slots": ["10:15", "11:00", "14:30"],
  "status": "available",
  "updatedAt": "2025-12-04T10:30:00Z"
}
```

バケット: `gs://reservation-timeslots-fujiminohikari/`
- `timeslots.json` - 一般予約（最新）
- `timeslots-shiya.json` - 視野予約（最新）
- `history/general/*.json` - 履歴データ
- `history/shiya/*.json` - 履歴データ

## 日付判定ロジック（重要）

```
火曜18:30以降   → 木曜日をチェック（水曜休診のため）
水曜日（終日）   → 木曜日をチェック
月末18:30以降   → 翌月1日をチェック
年末年始(12/31-1/3) → 営業再開日をチェック
その他18:30以降 → 明日をチェック
18:30より前     → 本日をチェック
```

## Cloud Run デプロイ

```bash
cd docker-timeslot-checker-unified
gcloud run deploy reservation-timeslot-checker-unified \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 3
```

エンドポイント:
- 一般: `/check?type=general`
- 視野: `/check?type=shiya`
- テスト: `/test?type=general|shiya`
- 月次集計: `/generate-monthly-summary?type=...`

## 開発時の注意点

1. **メモリ設定**: Cloud Runは最低1Gi必要（Puppeteer使用のため）
2. **タイムゾーン**: Asia/Tokyo、UTCオフセット方式を使用
3. **キャッシュ問題**: Dockerfileに変更を加えてリビルドで解決
4. **古いリビジョン**: Cloud Runデプロイ後、不要なリビジョンは削除
5. **デバッグ**: D キーでデバッグパネル開閉（テストページ）
6. **2種類の予約**: 一般と視野は完全に独立、混同しないこと

## Google Cloud リソース

- プロジェクトID: `forward-script-470815-c5`
- リージョン: `asia-northeast1`
- バケット: `reservation-timeslots-fujiminohikari`

## GitHub Pages URL

https://nekonekoganka.github.io/reservation-status/

## 関連ドキュメント

- `README.md` - プロジェクト概要
- `DEPLOY_GUIDE.md` - デプロイ手順
- `DEPLOY_UNIFIED_SERVICE.md` - 統合版デプロイ詳細
- `COST_OPTIMIZATION_GUIDE.md` - コスト最適化
- `docs/handover-to-claude-code.md` - 引き継ぎ資料
