# Cloudflare Pages 移行ガイド

## 目的

GitHub Pages → Cloudflare Pages に静的サイトホスティングを移行し、GitHubリポジトリを**プライベート化**する。

### なぜ移行するか

- GitHub Pages（無料プラン）はパブリックリポジトリでしか利用できない
- Cloudflare Pages はプライベートリポジトリからのデプロイに対応
- 移行後、リポジトリをプライベートに変更できる

### セキュリティ上の判断

このリポジトリに機密情報（APIキー、患者データ等）は含まれていないが、プライベート化には以下のメリットがある：

| 観点 | 現状（パブリック） | プライベート化後 |
|---|---|---|
| スクレイピングロジック | Puppeteerコードが公開 | 非公開 |
| GCPプロジェクトID | `<YOUR_PROJECT_ID>` が公開 | 非公開 |
| インフラ構成 | Cloud Scheduler頻度等が公開 | 非公開 |
| CK Reserve予約URL | スクレイピング対象URLが公開 | 非公開 |

---

## 前提：変更不要なもの

以下のコンポーネントはGitHub Pagesに依存しておらず、**移行作業の対象外**。

| コンポーネント | 理由 |
|---|---|
| Cloud Run（スクレイパー） | Google Cloud上で独立稼働 |
| Cloud Storage（JSONデータ） | 公開バケット、CORS `origin: ["*"]` で全ドメイン許可済み |
| Cloud Scheduler（6ジョブ） | Cloud Runを直接呼び出し |
| Androidアプリ | Cloud Storage URLのみ参照（GitHub Pages不使用） |

---

## 移行手順

### Step 1: Cloudflare Pages プロジェクト作成

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. Workers & Pages → Create → Pages → Connect to Git
3. GitHubアカウントを連携し、`nekonekoganka/reservation-status` を選択
4. ビルド設定：

| 設定項目 | 値 |
|---|---|
| Production branch | `main` |
| Build command | なし（空欄） |
| Build output directory | `/` （ルート） |

> **補足：** 全ファイルが静的HTML。ビルドステップ不要。

5. デプロイ実行 → `https://reservation-status.pages.dev` 等のURLが発行される

---

### Step 2: 公開ディレクトリの整理（推奨）

現在のGitHub Pagesはリポジトリ全体を公開しているため、Dockerコードやデプロイガイド等も外部からアクセス可能な状態。Cloudflare移行を機に、公開ファイルを分離することを推奨。

#### 方法A: 公開用ディレクトリを作る

```
reservation-status/
├── public/                          ← Cloudflare Pagesの出力ディレクトリに指定
│   ├── timeslot-banner.html
│   ├── timeslot-status-checker.html
│   ├── timeslot-display.html
│   ├── timeslot-display-shiya.html
│   ├── timeslot-display-test.html
│   ├── timeslot-display-test-shiya.html
│   ├── entrance-display.html
│   ├── entrance-display-debug.html
│   ├── dashboard.html
│   ├── chrome-extension-help.html
│   ├── icon-preview.html
│   ├── manifest.json
│   ├── dashboard-icon.png
│   └── Downloads/
│       └── QR_fujiminohikari.png
├── docker-timeslot-checker-unified/ ← 非公開
├── chrome-extension-*/              ← 非公開
├── android-reservation-status/      ← 非公開
└── ...
```

Cloudflare Pages設定で Build output directory を `public` に変更する。

#### 方法B: 現状のまま（ルート全体を公開）

手間を最小限にする場合はこのまま移行も可能。ただし、セキュリティ的にはDockerファイルやデプロイガイドが公開され続ける点に注意。

---

### Step 3: GitHub Pages URL の書き換え

`https://nekonekoganka.github.io/reservation-status/` を新ドメインに置換する。

#### 3-1. HTMLファイル（1箇所）

**chrome-extension-help.html**
```html
<!-- 変更前 -->
<a href="https://nekonekoganka.github.io/reservation-status/timeslot-status-checker.html">

<!-- 変更後（例） -->
<a href="https://reservation-status.pages.dev/timeslot-status-checker.html">
```

> その他のHTMLファイル（`timeslot-banner.html` 等）はCloud Storage URLのみ参照しており、変更不要。

#### 3-2. Chrome拡張機能（重要 - 3つ）

**chrome-extension-timeslot-general/popup.html**
```html
<!-- 変更前 -->
<a href="https://nekonekoganka.github.io/reservation-status/chrome-extension-help.html">
<a href="https://nekonekoganka.github.io/reservation-status/dashboard.html">

<!-- 変更後 -->
<a href="https://reservation-status.pages.dev/chrome-extension-help.html">
<a href="https://reservation-status.pages.dev/dashboard.html">
```

**chrome-extension-timeslot-shiya/popup.html** — 同上の変更

**chrome-extension-auto-reload/manifest.json**
```json
// 変更前
"host_permissions": ["https://nekonekoganka.github.io/*"]

// 変更後
"host_permissions": ["https://reservation-status.pages.dev/*"]
```

**chrome-extension-auto-reload/background.js**
```javascript
// 変更前
const TARGET_URLS = [
  'https://nekonekoganka.github.io/reservation-status/display.html',
  'https://nekonekoganka.github.io/reservation-status/display-shiya.html',
  'https://nekonekoganka.github.io/reservation-status/display-combined.html'
];

// 変更後
const TARGET_URLS = [
  'https://reservation-status.pages.dev/display.html',
  'https://reservation-status.pages.dev/display-shiya.html',
  'https://reservation-status.pages.dev/display-combined.html'
];
```

#### 3-3. README.md

ドキュメント内の全GitHub Pages URLを新ドメインに更新する。

---

### Step 4: クリニックHPの iframe URL 更新

クリニックのホームページ側で、埋め込みコードのURLを変更する。

```html
<!-- 変更前 -->
<iframe
  src="https://nekonekoganka.github.io/reservation-status/timeslot-banner.html"
  width="100%" height="280" frameborder="0" scrolling="no"
  style="border:none;">
</iframe>

<!-- 変更後 -->
<iframe
  src="https://reservation-status.pages.dev/timeslot-banner.html"
  width="100%" height="280" frameborder="0" scrolling="no"
  style="border:none;">
</iframe>
```

夜間非表示スクリプト付きバージョンも同様にURLを変更する。

---

### Step 5: 動作確認

| 確認項目 | 確認方法 |
|---|---|
| 全HTMLページの表示 | 新URLで各ページにアクセス |
| Cloud Storageからのデータ取得 | `timeslot-banner.html` で予約情報が表示されるか |
| iframe埋め込み | クリニックHP上でバナーが正常表示されるか |
| 自動更新（30秒/1分間隔） | ページを開いたまま待機して更新されるか |
| dashboard.html | Chart.js CDNの読み込み + 履歴データ取得 |
| PWA manifest | `manifest.json` が正しく読み込まれるか |
| Chrome拡張（一般） | ポップアップ内リンクが新URLで開くか |
| Chrome拡張（視野） | 同上 |
| Chrome拡張（auto-reload） | 表示ページの自動リロードが動作するか |
| `Downloads/QR_fujiminohikari.png` | QR画像が表示されるか |

---

### Step 6: GitHub Actions の無効化

動作確認完了後、`.github/workflows/pages.yml` を削除またはワークフローを無効化する。

```bash
# 削除する場合
git rm .github/workflows/pages.yml
git commit -m "GitHub Pages ワークフローを削除（Cloudflare Pages に移行済み）"
```

---

### Step 7: リポジトリをプライベートに変更

1. GitHub → `nekonekoganka/reservation-status` → Settings
2. Danger Zone → Change repository visibility → Make private
3. 確認して実行

> **注意：** Cloudflare Pages のGitHub連携が正常に動作していることを必ず確認してから実行。

---

### Step 8: Chrome拡張機能の再公開（該当する場合）

Chrome Web Storeに公開済みの場合、URL変更を反映した新バージョンを提出する。

1. `manifest.json` の `version` をインクリメント
2. 拡張機能をZIPにパッケージ
3. Chrome Web Store Developer Dashboard からアップロード
4. 審査を待つ（通常数日）

---

## 変更対象ファイル一覧

| ファイル | 変更内容 | 必須/推奨 |
|---|---|---|
| `chrome-extension-help.html` | GitHub Pages URL → 新URL | 必須 |
| `chrome-extension-timeslot-general/popup.html` | リンクURL 2箇所 | 必須 |
| `chrome-extension-timeslot-shiya/popup.html` | リンクURL 2箇所 | 必須 |
| `chrome-extension-auto-reload/manifest.json` | `host_permissions` | 必須 |
| `chrome-extension-auto-reload/background.js` | `TARGET_URLS` 3箇所 | 必須 |
| `README.md` | 全GitHub Pages URL（約10箇所） | 推奨 |
| `.github/workflows/pages.yml` | 削除または無効化 | 推奨 |

---

## コスト

Cloudflare Pages 無料枠：

| 項目 | 無料枠 | このプロジェクトの使用量 |
|---|---|---|
| ビルド回数 | 500回/月 | `main` へのpush回数（月数回程度） |
| 帯域幅 | 無制限 | - |
| リクエスト数 | 無制限 | - |
| カスタムドメイン | 対応 | 必要に応じて設定 |

**追加費用：なし（無料枠で十分）**

---

## リスクと対策

| リスク | 影響 | 対策 |
|---|---|---|
| Cloudflareの障害 | 全HTMLページが表示不能 | データ自体はCloud Storageにあるため、Chrome拡張とAndroidアプリは影響なし |
| URL変更の漏れ | 一部リンク切れ | 上記の変更対象一覧を確認 |
| iframe の Mixed Content | クリニックHPがHTTPの場合にブロック | Cloudflare Pages は HTTPS なので問題なし |
| Chrome拡張の審査遅延 | 旧URLのまま動作する期間が発生 | GitHub Pagesを一定期間並行稼働させる |

### 移行時の安全策

1. Cloudflare Pagesでデプロイ・動作確認
2. クリニックHPのiframeを新URLに切り替え
3. 数日間、GitHub Pages（パブリック状態）を維持して問題ないか確認
4. 問題なければリポジトリをプライベートに変更（GitHub Pagesは自動停止）
