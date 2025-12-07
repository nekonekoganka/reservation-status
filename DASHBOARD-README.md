# 予約傾向ダッシュボード

予約状況の傾向を分析・可視化するダッシュボードです。

## 機能

- **曜日別の平均空き枠数**: どの曜日が混雑しやすいかを把握
- **時間帯別の平均空き枠数**: 何時頃に予約が埋まりやすいかを分析
- **日別推移グラフ**: 長期的なトレンドを可視化
- **統計サマリー**: 平均空き枠数、最も混雑する曜日など

## データ保存期間

履歴データは最大3年分保存されます（Cloud Storageの容量制限まで）。

---

## セットアップ手順

### 1. Cloud Runの更新（履歴保存機能の追加）

Cloud Runサービスを更新して、履歴データを保存する機能を追加します。

#### 一般予約（docker-timeslot-checker）の更新

1. Google Cloud Console にログイン
2. Cloud Run → `timeslot-checker` サービスを選択
3. 「新しいリビジョンの編集とデプロイ」をクリック
4. ソースコードを更新（以下の手順）

**更新方法A: Cloud Shellを使う場合**

```bash
# Cloud Shellを開く
cd ~
git clone https://github.com/nekonekoganka/reservation-status.git
cd reservation-status/docker-timeslot-checker

# Cloud Runにデプロイ
gcloud run deploy timeslot-checker \
  --source . \
  --region asia-northeast1 \
  --allow-unauthenticated
```

**更新方法B: ローカルからデプロイする場合**

```bash
cd docker-timeslot-checker
gcloud run deploy timeslot-checker \
  --source . \
  --region asia-northeast1 \
  --allow-unauthenticated
```

#### 視野予約（docker-timeslot-checker-shiya）の更新

同様の手順で `timeslot-checker-shiya` サービスを更新:

```bash
cd docker-timeslot-checker-shiya
gcloud run deploy timeslot-checker-shiya \
  --source . \
  --region asia-northeast1 \
  --allow-unauthenticated
```

### 2. ダッシュボードへのアクセス

更新完了後、以下のURLでダッシュボードにアクセスできます:

```
https://nekonekoganka.github.io/reservation-status/dashboard.html
```

---

## 履歴データの形式

履歴データは Cloud Storage に以下の形式で保存されます:

```
gs://fujimino-ophthalmology-reservations/
├── history/
│   ├── general/           # 一般予約の履歴
│   │   ├── 2024-12-07.json
│   │   ├── 2024-12-08.json
│   │   └── ...
│   └── shiya/             # 視野予約の履歴
│       ├── 2024-12-07.json
│       ├── 2024-12-08.json
│       └── ...
```

各JSONファイルの内容:

```json
[
  {
    "time": "09:15",
    "count": 5,
    "status": "○ 空きあり",
    "targetDate": 7
  },
  {
    "time": "09:16",
    "count": 4,
    "status": "○ 空きあり",
    "targetDate": 7
  }
]
```

---

## 院内専用にする方法（将来のアクセス制限）

ダッシュボードを院内PCからのみアクセス可能にしたい場合の手順です。

### 方法1: GitHub Pages を非公開にしてローカルで表示

1. **GitHubリポジトリをPrivateに変更**
   - リポジトリの Settings → General → Danger Zone
   - 「Change repository visibility」→ 「Make private」

2. **ローカルサーバーで表示**
   ```bash
   # 院内サーバーにクローン
   git clone https://github.com/nekonekoganka/reservation-status.git
   cd reservation-status

   # 簡易サーバーを起動（Python 3の場合）
   python -m http.server 8080
   ```

   ブラウザで `http://localhost:8080/dashboard.html` にアクセス

### 方法2: Basic認証を追加（Cloudflare経由）

1. **Cloudflareにサイトを登録**
2. **Access Policies でIP制限を設定**
   - 院内IPアドレスのみ許可
   - または Basic認証を設定

### 方法3: Cloud Storage の履歴データにアクセス制限

現在、履歴データは公開設定ですが、認証を必要にできます:

```bash
# 履歴データを非公開に設定
gsutil acl ch -d AllUsers gs://fujimino-ophthalmology-reservations/history/**

# サービスアカウントのみアクセス可能に
gsutil iam ch serviceAccount:YOUR_SERVICE_ACCOUNT@PROJECT.iam.gserviceaccount.com:objectViewer \
  gs://fujimino-ophthalmology-reservations
```

この場合、ダッシュボードからのアクセスには認証が必要になるため、
Cloud Run上でダッシュボードをホストする構成に変更する必要があります。

### 方法4: VPN経由でのみアクセス（推奨）

院内VPNを設定し、VPN接続時のみアクセス可能にする:

1. 院内にVPNサーバーを設置（WireGuard推奨）
2. ダッシュボードを院内サーバーでホスト
3. VPN経由でのみアクセス可能

---

## トラブルシューティング

### データが表示されない場合

1. **Cloud Runが稼働しているか確認**
   - Google Cloud Console → Cloud Run
   - サービスのステータスを確認

2. **履歴保存機能が動作しているか確認**
   - Cloud Storage → `fujimino-ophthalmology-reservations` バケット
   - `history/general/` フォルダに今日の日付のJSONファイルがあるか確認

3. **CORSエラーの場合**
   - ブラウザのデベロッパーツール（F12）でエラーを確認
   - Cloud StorageのCORS設定を確認

### 古いデータの削除

3年以上経過したデータを削除したい場合:

```bash
# 2021年のデータを削除する例
gsutil rm gs://fujimino-ophthalmology-reservations/history/general/2021-*.json
gsutil rm gs://fujimino-ophthalmology-reservations/history/shiya/2021-*.json
```

---

## 技術仕様

| 項目 | 詳細 |
|------|------|
| フロントエンド | HTML + JavaScript (Vanilla) |
| チャートライブラリ | Chart.js |
| データソース | Cloud Storage (JSON) |
| 更新頻度 | 1分ごと（Cloud Run稼働時） |
| 保存期間 | 最大3年 |

---

## バージョン履歴

- **v1.0.0** (2024-12-07)
  - 初回リリース
  - 曜日別・時間帯別の分析機能
  - 日別推移グラフ
  - 期間選択機能
