# 予約状況自動更新システム

眼科クリニックの予約状況を自動判定し、ホームページのバナーに表示するシステムです。

**対応予約:** 一般予約・視野予約の2種類の予約システムを独立して管理

## 🌐 デモ

### 一般予約（fujimino）

**バナー表示（ホームページ埋め込み用）：** https://nekonekoganka.github.io/reservation-status/

**全画面ディスプレイ（クリニック入口用・レスポンシブ対応）：** https://nekonekoganka.github.io/reservation-status/display.html

**デバッグページ（テスト用）：** https://nekonekoganka.github.io/reservation-status/display-test.html

### 視野予約（fujiminohikari）🆕

**バナー表示（ホームページ埋め込み用）：** https://nekonekoganka.github.io/reservation-status/shiya.html

**全画面ディスプレイ（クリニック入口用・レスポンシブ対応）：** https://nekonekoganka.github.io/reservation-status/display-shiya.html

**デバッグページ（テスト用）：** https://nekonekoganka.github.io/reservation-status/display-test-shiya.html

### 統合予約状況ディスプレイ 🆕

**全画面ディスプレイ（一般予約+視野予約の統合表示）：** https://nekonekoganka.github.io/reservation-status/display-combined.html

- 一般予約と視野予約の両方のデータを統合判定
- 両方とも満枠 → 「満枠」表示（QRコード表示）
- どちらか空き → 「空き」表示（QRコードなし）

---

## 📌 主な機能

1. **Chrome拡張機能** - 予約ページから空き状況を自動判定
2. **Docker自動化システム** - Cloud Runで営業時間に応じて自動実行 🆕
3. **Googleスプレッドシート連携** - 判定結果を自動記録
4. **GitHub Pagesバナー** - ホームページに埋め込み可能なバナー
5. **全画面ディスプレイ** - レスポンシブ対応・アイコン表示（⭕/😔）・バナー表示・QRコード表示 🆕
6. **高機能デバッグページ** - 10種類のタブで完全カスタマイズ可能 🆕
   - テキスト・アイコン・色・サイズ・レイアウト・バナー・QRコード・アニメーション・背景・設定
   - プリセット管理（5スロット）・デフォルト設定保存・エクスポート/インポート
   - フルスクリーンモード・トップバー2段構成・フローティングボタン
7. **曜日・時間対応** - 火曜18:30以降は木曜、水曜は木曜をチェック
8. **自動データ管理** - 20,000行以上の古いデータを自動削除
9. **iframe対応** - iframe内のカレンダーも正しく検出

---

## 🗂️ ディレクトリ構成

```
reservation-status/
├── index.html                  # 一般予約: バナー表示用HTML（ホームページ埋め込み用）
├── display.html                # 一般予約: 全画面ディスプレイ用HTML（レスポンシブ対応・クリニック入口用）🆕
├── display-test.html           # 一般予約: デバッグ用テストページ（カスタマイズ機能付き）🆕
├── shiya.html                  # 視野予約: バナー表示用HTML（ホームページ埋め込み用）🆕
├── display-shiya.html          # 視野予約: 全画面ディスプレイ用HTML（レスポンシブ対応・クリニック入口用）🆕
├── display-test-shiya.html     # 視野予約: デバッグ用テストページ（カスタマイズ機能付き）🆕
├── display-combined.html       # 統合ディスプレイ: 一般予約+視野予約の統合判定表示 🆕
├── Downloads/                  # バナー用画像ファイル・設定ファイル
│   ├── vacant_reservation.png  # 予約空きありバナー
│   ├── full_reservation.png    # 予約満バナー
│   ├── closed_days.png         # 休診日バナー
│   ├── QR_fujiminohikari.png   # 一般予約QRコード（左下固定表示）
│   ├── QR_Field_of_vision_reservation.png   # 視野予約QRコード🆕
│   └── display-preset.json     # ディスプレイ設定プリセット（色・サイズ・間隔・エフェクト）🆕
├── docs/                       # ドキュメント
│   ├── handover-to-claude-code.md      # システム全体の引き継ぎ資料
│   ├── implementation-guide-v5.md      # 実装手順
│   ├── delete-old-rows-guide.md        # データ管理設定（一般予約）
│   └── delete-old-rows-shiya-guide.md  # データ管理設定（視野予約）🆕
├── chrome-extension/           # Chrome拡張機能（予約状況チェック）
│   ├── content.js
│   ├── manifest.json
│   ├── google-apps-script.js
│   ├── README.md
│   └── ICON_README.md
├── chrome-extension-auto-reload/  # Chrome拡張機能（ディスプレイ自動リロード）🆕
│   ├── manifest.json           # Manifest V3設定
│   ├── background.js           # Service Worker（60秒タイマー）
│   ├── content.js              # ページリロード処理
│   └── README.md               # インストール・設定手順
├── chrome-web-store/           # Chrome Web Store公開用ファイル 🆕
│   ├── publishing-guide.md     # 公開手順ガイド
│   ├── store-listing.md        # ストア掲載情報
│   ├── privacy-policy.md       # プライバシーポリシー
│   └── screenshot-guide.md     # スクリーンショットガイド
├── docker-automation/          # 一般予約: Docker自動化システム 🆕
│   ├── server.js               # メインコード（Node.js + Puppeteer）
│   ├── Dockerfile              # Docker設定
│   ├── package.json            # 依存関係
│   └── README.md               # 詳細なデプロイ手順
├── docker-automation-shiya/    # 視野予約: Docker自動化システム 🆕
│   ├── server.js               # メインコード（Node.js + Puppeteer）
│   ├── Dockerfile              # Docker設定
│   ├── package.json            # 依存関係
│   └── README.md               # 詳細なデプロイ手順
├── gas/                        # Google Apps Script
│   ├── google-apps-script-shiya.js  # 視野予約用GAS 🆕
│   ├── delete-old-rows-fixed.gs     # 一般予約：古い行削除GAS
│   └── delete-old-rows-shiya.gs     # 視野予約：古い行削除GAS 🆕
└── bookmarklet/                # ブックマークレット（スマホ用）
    └── bookmarklet-v7.md
```

---

## 🚀 クイックスタート

このシステムは3つの利用方法があります。目的に応じて選択してください。

### 方式A: Chrome拡張機能（手動実行）

予約ページでボタンをクリックして手動チェック

```bash
1. chrome://extensions/ を開く
2. デベロッパーモードをON
3. 「パッケージ化されていない拡張機能を読み込む」
4. chrome-extension フォルダを選択
```

詳細：[chrome-extension/README.md](chrome-extension/README.md)

### 方式B: Docker自動化（完全自動）🆕 【おすすめ】

Cloud Runで営業時間中1分ごと、営業時間外5分ごとに自動実行

```bash
# 詳細なセットアップ手順はこちら
docker-automation/README.md
```

- **メリット:** 完全自動、メンテナンス不要
- **デメリット:** わずかな費用が発生（月20〜80円）
- **Google Cloudプロジェクト:**
  - プロジェクト番号: 224924651996
  - プロジェクト ID: forward-script-470815-c5
- 詳細：[docker-automation/README.md](docker-automation/README.md)

### 方式C: ブックマークレット（スマホ用）

スマートフォンから手動実行

詳細：[bookmarklet/bookmarklet-v7.md](bookmarklet/bookmarklet-v7.md)

---

### バナーをホームページに埋め込み

```html
<iframe
  src="https://nekonekoganka.github.io/reservation-status/"
  width="100%"
  height="250"
  frameborder="0"
  style="border:none; margin:10px 0; display:block;">
</iframe>
```

---

## 📖 ドキュメント

- **[システム全体の説明](docs/handover-to-claude-code.md)** - 完全な引き継ぎ資料
- **[実装手順](docs/implementation-guide-v5.md)** - セットアップガイド
- **[データ管理設定](docs/delete-old-rows-guide.md)** - GASの自動削除設定

---

## 🔧 技術スタック

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Google Apps Script
- **Data Storage:** Google Spreadsheet
- **Hosting:** GitHub Pages
- **Browser Extension:** Chrome Extension (Manifest V3)
- **Automation:** Node.js, Puppeteer, Docker 🆕
- **Cloud Platform:** Google Cloud Run, Cloud Scheduler 🆕
  - プロジェクト番号: 224924651996
  - プロジェクト ID: forward-script-470815-c5

---

## 📊 動作フロー

### 方式A: Chrome拡張機能（手動）
```
予約ページ
    ↓
Chrome拡張機能（手動クリック）
    ↓
Google Apps Script
    ↓
Googleスプレッドシート
    ↓
GitHub Pagesバナー（リアルタイム更新）
```

### 方式B: Docker自動化（完全自動）🆕
```
Cloud Scheduler（5分ごと）
    ↓
Cloud Run（Puppeteer）
    ↓
Google Apps Script
    ↓
Googleスプレッドシート
    ↓
GitHub Pagesバナー（リアルタイム更新）
```

---

## 🏥 クリニック情報

### ふじみ野ひかり眼科

- **休診日:** 毎週水曜日
- **午前受付時間:** 〜13:30まで
- **午後受付時間:** 〜18:30まで
- **祝日:** 営業しています
- **年末年始休業:** 12月31日〜1月3日

### 全画面ディスプレイのバナー表示

- **営業時間前:** 8:00-9:59（営業日のみ）「🕐 10時に窓口が開きます　お待ち下さい」
- **昼休み:** 13:30-14:59（営業日のみ）「🕐 昼休み中　午後３時より診療再開」
- **水曜日:** バナー表示なし（休診日）

---

## ⚙️ 設定

### スプレッドシート

```javascript
const SPREADSHEET_ID = '1RSd9aC5B_-gQ1_j5V1aQcZn1iVw9v8mpmhJ78_8gY80';
const SHEET_NAME = 'フォームの回答 1';
```

### 予約ページURL

```
https://ckreserve.com/clinic/fujiminohikari-ganka
```

---

## 📅 日付判定ロジック

- **火曜18:30以降** → 木曜日をチェック
- **水曜日（終日）** → 木曜日をチェック
- **月末18:30以降** → 自動判定不可（手動入力）
- **その他18:30以降** → 明日をチェック
- **18:30より前** → 本日をチェック

---

## 🔄 自動データ管理

毎週水曜日 午前3時に、20,000行を超えた古いデータを自動削除します。

設定方法：[docs/delete-old-rows-guide.md](docs/delete-old-rows-guide.md)

---

## 📱 対応デバイス

- **PC:** Chrome拡張機能（手動）
- **スマホ:** ブックマークレット（手動）
- **自動化:** Docker + Cloud Run（完全自動、デバイス不要）🆕

---

## 🤝 開発者向け

### Claude Codeでの開発

このリポジトリはClaude Codeでの開発を想定しています。

**引き継ぎ資料：** [docs/handover-to-claude-code.md](docs/handover-to-claude-code.md)

---

## 🏪 Chrome Web Store（非公開公開）

このChrome拡張機能は、Chrome Web Storeに非公開公開する準備が完了しています。

- **公開方式:** 非公開（リンクを知っている人のみアクセス可）
- **準備状況:** 完了（PR #14）
- **詳細:** [chrome-web-store/publishing-guide.md](chrome-web-store/publishing-guide.md)

---

## 🆕 最近のアップデート（技術的な改善履歴）

### 2025年11月14日 - 統合予約状況ディスプレイの実装

#### 🎯 一般予約と視野予約の統合判定システム

**概要:**
一般予約と視野予約の2つのスプレッドシートから並列でデータを取得し、統合判定して表示する新しいディスプレイページを実装しました。

**新規作成ファイル:**
- `display-combined.html` - 統合予約状況ディスプレイ

**統合判定ロジック:**
```javascript
// 両方満枠の場合のみ「満枠」表示
const generalAvailable = generalData.status.includes('空きあり');
const shiyaAvailable = shiyaData.status.includes('空きあり');
const isAvailable = generalAvailable || shiyaAvailable;
```

**表示仕様:**

**空きあり（どちらか一方でも空き）:**
- メインメッセージ: 「本日の予約  「空き」あり」
- サブメッセージ: 「受付窓口でご案内いたします」
- 背景色: 緑（#27ae60）
- QRコード: 非表示
- アイコン: ⭕

**満枠（両方とも満枠）:**
- メインメッセージ: 「本日の予約は 「満枠」です」
- サブメッセージ: 「誠に恐れ入りますが、翌診療日以降で ご予約ください」
- QRメッセージ: 「受付窓口 もしくは QRコードから ご予約ください」
- 背景色: 赤（#dc3545）
- QRコード: 表示（一般予約QRコード）
- アイコン: 😔

**技術実装:**
- **Promise.all()** で2つのスプレッドシートから並列データ取得
- より新しいタイムスタンプを更新時刻として使用
- display-preset.jsonの設定を適用
- テキストシャドウ効果、営業時間前バナー、昼休みバナー、ファビコン対応

**利用シーン:**
クリニック入口に設置して、一般診療・視野検査のどちらかに空きがある限り「空き」を表示し、窓口での柔軟な案内を可能にします。

#### 🔄 Chrome拡張機能の3ページ対応（v1.2.0）

**変更内容:**
Chrome拡張機能 `chrome-extension-auto-reload` を更新し、統合ディスプレイも自動リロード対象に追加しました。

**更新ファイル:**

**1. manifest.json** (v1.1.0 → v1.2.0)
- `matches`配列に `display-combined.html` を追加
- 説明文を更新: 「display.html、display-shiya.html、display-combined.htmlを1分ごとに自動更新」

**2. background.js**
- `TARGET_URLS` に `display-combined.html` を追加
- コメントを更新

**対応ページ（合計3ページ）:**
1. `https://nekonekoganka.github.io/reservation-status/display.html`（一般予約）
2. `https://nekonekoganka.github.io/reservation-status/display-shiya.html`（視野予約）
3. `https://nekonekoganka.github.io/reservation-status/display-combined.html`（統合）← 🆕

**更新手順:**
1. `chrome://extensions/` を開く
2. 「更新」ボタンをクリック（v1.2.0に更新）

#### 📈 改善効果

1. **柔軟な窓口対応**: 一般診療・視野検査のどちらかに空きがあれば患者を受付可能
2. **シンプルな表示**: 患者目線では「空き/満枠」のみを大きく表示
3. **完全無料**: クライアントサイドの統合判定により追加コストゼロ
4. **既存システムとの共存**: display.html、display-shiya.htmlはそのまま残し、用途に応じて使い分け可能

#### 📁 変更ファイル
- `display-combined.html` - 新規作成（729行）
- `chrome-extension-auto-reload/manifest.json` - v1.2.0に更新
- `chrome-extension-auto-reload/background.js` - 3ページ対応

---

### 2025年11月14日 - ディスプレイ設定の統一とChrome拡張機能の追加

#### 🎨 display-preset.json設定システムの導入

**概要:**
ディスプレイの設定を一元管理するJSON設定ファイルを導入し、display.htmlとdisplay-shiya.htmlの両方に適用しました。

**新規作成ファイル:**
- `Downloads/display-preset.json` - 66個の設定パラメータを含む統合設定ファイル

**設定内容（主要項目）:**
- **テキスト設定:** clinicName、availableMsg、fullMsg、subMsg、qrMsg
- **色設定:** availableBg、fullBg、bannerBg、bannerText
- **サイズ設定:** iconSize、mainMsgSize、subMsgSize、qrMsgSize、updateTimeSize
- **レイアウト設定:** iconToMainGap、mainToSubGap、subToQrGap、qrToUpdateGap
- **フォント設定:** mainMsgFontWeight、subMsgFontWeight、qrMsgFontWeight
- **テキストエフェクト:** textShadowEnabled、textShadowColor、textShadowBlur、textShadowDistance
- **QRコード設定:** qrEnabled、qrSize、qrPosition、qrOpacity、qrBorderRadius
- **アニメーション設定:** pulseEnabled、pulseSpeed、pulseScale、glowEnabled
- **ファビコン設定:** faviconEnabled、faviconAvailableIcon、faviconFullIcon

**適用方針:**
- **display.html**: すべての設定を適用（一般予約用）
- **display-shiya.html**: テキスト内容以外のすべての設定を適用（視野予約のテキストは保持）

**主な変更点:**
- サブメッセージ: 「大変申し訳ございません」に統一
- QRメッセージ: 「ご予約は 受付窓口 もしくは QRコードから お願い致します」に統一
- バナーフォントサイズ: 2.8vw → 3.6vw（視認性向上）
- バナー高さ: 115px → 100px（コンパクト化）
- メインメッセージとサブメッセージの間隔: 60px → 20px（レイアウト最適化）

#### 🎨 全テキスト要素へのシャドウ効果適用

**修正前の問題:**
テキストシャドウ効果がメインメッセージとアイコンのみに適用されており、サブメッセージ・QRメッセージ・更新時刻には適用されていませんでした。

**実施した修正:**
- display.html: すべてのテキスト要素（icon、main-message、sub-message、qr-message、update-time）に`${textStyle}`を追加
- display-shiya.html: 同様にすべてのテキスト要素に`${textStyle}`を追加

**シャドウ設定:**
- 影の色: #000000（黒）
- ぼかし: 5px
- 距離: 3px
- どんな背景色でも視認性を確保

**generateTextStyle()関数の活用:**
```javascript
function generateTextStyle() {
    const shadows = [];
    if (DISPLAY_CONFIG.textShadowEnabled) {
        shadows.push(`0 ${DISPLAY_CONFIG.textShadowDistance}px ${DISPLAY_CONFIG.textShadowBlur}px ${DISPLAY_CONFIG.textShadowColor}`);
    }
    return shadows.length > 0 ? `text-shadow: ${shadows.join(', ')}` : '';
}
```

#### 🔄 Chrome拡張機能の2ページ自動リロード対応

**概要:**
Chrome拡張機能 `display-auto-reload` を拡張し、display.htmlとdisplay-shiya.htmlの両方を1分ごとに自動リロードする機能を実装しました。

**変更ファイル:**

**1. manifest.json** (chrome-extension-auto-reload/manifest.json)
- `matches`配列を2つのURLに拡張:
  - `https://nekonekoganka.github.io/reservation-status/display.html`
  - `https://nekonekoganka.github.io/reservation-status/display-shiya.html`
- バージョン: 1.0 → 1.1.0
- 説明文を更新: 「display.htmlとdisplay-shiya.htmlを1分ごとに自動更新」

**2. background.js** (chrome-extension-auto-reload/background.js)
- `TARGET_URL`（単一）→ `TARGET_URLS`（配列）に変更
- ループ処理で複数URLのタブを検索・リロード
- ログメッセージを更新: 「X個のタブを発見しました」

**3. content.js** (chrome-extension-auto-reload/content.js)
- 変更なし（既存のリロードロジックをそのまま使用）

**4. README.md** (chrome-extension-auto-reload/README.md)
- 対象URLを2つに更新
- 動作確認手順を両ページ対応に更新
- コンソールログ例を更新（複数タブ対応）

**技術仕様:**
- **更新間隔:** 60秒（1分）ごと
- **動作方式:** Service Worker（Manifest V3）
- **使用API:** chrome.alarms、chrome.tabs、chrome.runtime
- **動作条件:** タブがアクティブでない状態でも更新を継続

**インストール手順:**
1. `chrome://extensions/` を開く
2. デベロッパーモードをON
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `chrome-extension-auto-reload/` フォルダを選択

詳細: [chrome-extension-auto-reload/README.md](chrome-extension-auto-reload/README.md)

#### 📈 改善効果

1. **設定の一元管理**: 66個のパラメータをJSONファイルで管理し、変更が容易に
2. **一貫性の向上**: display.htmlとdisplay-shiya.htmlで共通のスタイルを使用
3. **視認性の向上**: すべてのテキスト要素にシャドウ効果を適用し、背景色に依存しない視認性を確保
4. **自動更新の完全化**: 一般予約と視野予約の両ディスプレイを自動リロードし、常に最新の状態を表示

#### 📁 変更ファイル
- `Downloads/display-preset.json` - 新規作成
- `display.html` - 設定適用、全テキストにシャドウ追加
- `display-shiya.html` - 設定適用（テキスト保持）、全テキストにシャドウ追加
- `chrome-extension-auto-reload/manifest.json` - 2URL対応
- `chrome-extension-auto-reload/background.js` - 複数URL処理
- `chrome-extension-auto-reload/README.md` - ドキュメント更新

---

### 2025年11月14日 - 視野予約システムの追加

#### 🎯 完全に独立した視野予約システムを構築

**概要:**
一般予約（fujimino）とは完全に独立した視野予約（fujiminohikari）システムを新規構築しました。

**新規作成ファイル:**

**1. Google Apps Script（視野予約専用）**
- `gas/google-apps-script-shiya.js` - 視野予約用GAS
- スプレッドシート「フォームの回答_視野予約」に記録

**2. Docker自動化システム（視野予約専用）**
- `docker-automation-shiya/server.js` - Puppeteer自動化コード
- `docker-automation-shiya/package.json` - 依存関係
- `docker-automation-shiya/Dockerfile` - Docker設定
- `docker-automation-shiya/README.md` - デプロイ手順書
- 予約ページ: `https://ckreserve.com/clinic/fujiminohikari-ganka/fujiminohikari`

**3. 表示用HTML（視野予約専用）**
- `shiya.html` - バナー（ホームページ埋め込み用）
- `display-shiya.html` - 全画面ディスプレイ（クリニック入口用）
- `display-test-shiya.html` - デバッグページ
- 表示名称: 「ふじみ野ひかり眼科 視野予約」
- メッセージ: 「視野予約枠 「空き」あり」

**設計方針:**
- 一般予約システムに一切触れず、完全独立
- 同じロジック（日付判定、営業時間、実行頻度）を使用
- Cloud Runで2つのサービスを並行稼働（月40〜160円程度）

**デプロイ方法:**
- 一般予約: Cloud Run `reservation-checker`
- 視野予約: Cloud Run `reservation-checker-shiya` ← 新規
- 詳細: `docker-automation-shiya/README.md` 参照

---

### 2025年11月13日 - display.htmlとdisplay-test.htmlのレイアウト統一

#### 🎯 本番ビューでの起動と設定管理の改善（PR #82, #81, #80）

**1. display-test.htmlを本番モードで起動** (PR #82)
- デバッグページの初期表示を本番モードに変更
- 実際の運用環境と同じ状態でプレビュー可能に
- 本番モード時の読み込み状態表示機能を追加
- デバッグモードとの切り替えがスムーズに

**2. レイアウトの微調整とスタイル統一** (PR #81)
- display-test.htmlのプレビューパディングを削除
- display.htmlの冗長なスタイル定義を整理
- 本番環境とテスト環境のレイアウトを完全に一致
- QRコードの位置を微調整（bottom: 30px）

**3. display.htmlに設定管理機能を追加** (PR #80)
- **DISPLAY_CONFIG**: メッセージ・アイコンを一元管理
  ```javascript
  availableMsg: '{day}分の予約枠 「空き」あり'
  fullMsg: '{day}の予約は 「満枠」です'
  availableIcon: '⭕' / fullIcon: '😔'
  ```
- **FAVICON_CONFIG**: ファビコン設定を追加
  - 空きあり: 緑色の「OK」
  - 満枠: 赤色の「✕」
  - ブラウザタブでも予約状況を確認可能に
- デフォルト設定をdisplay-test.htmlと完全統一
- バナーのフォントサイズ（2.8vw）と高さ（115px）を最適化
- QRコードのスタイルを調整（175px、角丸10px、影効果）

#### 📈 改善効果

1. **一貫性の向上**: 本番環境とテスト環境の設定が完全に一致
2. **保守性の向上**: 設定値が一元管理され、変更が容易に
3. **ユーザビリティ**: ファビコンでタブ切り替え時も状態確認が可能
4. **デバッグ効率**: 本番モードで起動し、実環境に近い状態でテスト可能

#### 📁 変更ファイル
- `display-test.html` - 本番モード起動、レイアウト調整
- `display.html` - 設定管理機能追加、ファビコン実装

---

### 2025年11月13日 - デバッグページの完全リニューアル

#### 🎨 UI/UXの全面刷新

**1. トップバー2段構成の実装**
- **1段目**: デバッグモード/本番モード・空きあり/満枠ステータス・パネル表示/非表示
- **2段目**: 全タブボタン（10種類）+ エクスポート/インポート
- デバッグコントロールを画面上部に集約し、操作性を大幅に向上

**2. フルスクリーンモード**
- パネル非表示時にトップバー・デバッグパネルを完全非表示
- メイン画面を100%表示（実機プレビューに最適）
- 右下に🛠️フローティングボタンを表示（パネル呼び出し用）
- 初期起動時は自動的にフルスクリーンモードで表示

**3. デフォルト設定保存機能（localStorage）**
- 「この設定をデフォルトにする」ボタンで現在の設定を保存
- 次回起動時に自動的に保存した設定を読み込み
- 「デフォルト設定を読み込む」「デフォルト設定をクリア」機能も追加

#### 🛠️ 新機能の追加

**4. プリセット管理システム（5スロット）**
- 5つのスロットにカスタマイズ設定を保存可能
- プリセット名を自由に設定
- 保存・読み込み・削除・エクスポート機能
- 現在のプリセット情報を常に表示

**5. 設定のエクスポート/インポート**
- カスタマイズ設定をJSONファイルでエクスポート
- JSONファイルから設定をインポート
- バージョン情報・エクスポート日時を記録
- 設定の共有やバックアップに活用可能

**6. 新規タブの追加**
- **📐レイアウトタブ**: 要素間の間隔・フォントウェイト・テキストエフェクト（影・縁取り）
- **🏷️バナータブ**: 営業時間前・昼休みバナーのテキスト・サイズ・高さ・余白
- **📱QRコードタブ**: 表示/非表示・サイズ・位置・不透明度・角丸・影効果・画像URL

#### 🎯 デフォルト設定の変更

**7. display.html・display-test.htmlの初期設定**
- デフォルトプリセットを「基本その１「枠」つき」に変更
- メッセージ: 「{day}分の予約枠 **「空き」** あり」「{day}の予約は **「満枠」** です」
- アイコン: 空きあり ⭕ / 満枠 😔
- より親しみやすく、視認性の高いデザインに

#### 📁 変更ファイル
- `display-test.html` - UI全面刷新、10タブ実装、プリセット・デフォルト設定機能
- `display.html` - デフォルトメッセージとアイコンを変更

---

### 2025年11月11日 - 全画面ディスプレイの大幅改善

#### 🎨 デザインとUXの刷新

**1. レスポンシブ対応**
- 1920×1080固定から様々な画面サイズに対応（PC専用、スマホ・タブレット非対応）
- すべてのフォントサイズに `clamp()` を使用し、自動スケーリング
- QRコードもレスポンシブに（clamp(120px, 9vw, 180px)）

**2. デザインの簡素化**
- クリニック名「ふじみ野ひかり眼科」を非表示に（玄関前に飾るため不要）
- アイコンを上部に配置（margin-top: 80px追加）
- メッセージ先頭の絵文字を削除し、視認性を向上

**3. アイコンとメッセージの変更**
- 空きあり：✅ → **⭕**（シンプルで視認性が高い）
- 満枠：🙇 → ❌ → **😔**（柔らかい印象）
- メッセージ：「{day}分の予約枠 **「空き」** あり」「{day}の予約は **「満枠」** です」（「枠」文字を追加）
- 白い縁取り効果でどんな背景色でも視認性を確保

**4. 営業時間前バナーの追加**
- 8:00-9:59の間、営業日のみ「🕐 10時に窓口が開きます　お待ち下さい」を表示
- 既存の昼休みバナー（13:30-15:00）と統一されたデザイン
- 水曜日（休診日）は表示されない

#### 🛠️ デバッグページの大幅機能拡張

**トップバー2段構成**
- **1段目**: デバッグモード/本番モード切り替え・空きあり/満枠ステータス・パネル表示/非表示
- **2段目**: 全カスタマイズタブ + エクスポート/インポートボタン
- **フルスクリーンモード**: パネル非表示時は全画面表示（トップバー・デバッグパネル非表示）
- **フローティングボタン**: 全画面時に右下に🛠️ボタンを表示（パネル呼び出し用）

**タブベースUIの実装（全10タブ）**
- **⏰ 時間タブ**: 時間・曜日・状態のテスト（営業時間前ボタン追加）
- **📝 テキストタブ**: メッセージのカスタマイズ（{day}プレースホルダー対応）
- **🎨 デザインタブ**: アイコン選択・カラーピッカー（背景色・バナー色・ファビコン）
- **📏 サイズタブ**: 各要素のフォントサイズ調整（アイコン・メインメッセージ・サブメッセージ・QRメッセージ・更新時刻）
- **📐 レイアウトタブ**: 要素間の間隔・フォントウェイト・テキストエフェクト（影・縁取り）
- **🏷️ バナータブ**: 営業時間前・昼休みバナーのテキスト・フォントサイズ・高さ・余白
- **📱 QRコードタブ**: QRコード表示/非表示・サイズ・位置・不透明度・角丸・影効果・画像URL
- **⚡ アニメ1タブ**: パルスアニメーション・グロー効果
- **🎈 アニメ2タブ**: ふわふわ浮遊・ズームアニメ・キラキラ・ネオン・画面エフェクト
- **🌈 背景タブ**: グラデーション設定（タイプ・色・アニメーション）
- **💾 設定タブ**: プリセット管理（5スロット保存/読み込み/削除）・エクスポート/インポート・デフォルト設定

**主な機能**
- リアルタイムプレビュー（変更が即座に反映）
- アイコン選択（😊✅✔️⭕🟢👍 / 😔❌✖️🙇⛔🚫 + カスタム入力）
- 詳細なアニメーション制御（パルス・グロー・浮遊・ズーム・キラキラ・ネオン）
- レイアウトの完全カスタマイズ（間隔・太さ・影・縁取り）
- プリセット管理（5つのスロットに保存可能）
- デフォルト設定保存（localStorage）
- 設定のエクスポート/インポート（JSONファイル）
- すべてリセット機能

#### 📁 変更ファイル
- `display.html` - レスポンシブ対応、デザイン刷新、営業時間前バナー
- `display-test.html` - 高度なカスタマイズ機能実装

---

### 2025年11月7日 - CHATGPT CODEXによる重要な修正（PR #25）

#### 🐛 発見された問題

1. **デフォルトURLの不完全な指定**
   - 問題: `/fujimino` が欠けていたため、正しいページにアクセスできない可能性
   - 影響範囲: Docker自動化システム（server.js）

2. **カレンダー検出ロジックの複雑さとメンテナンス性**
   - 問題: iframe探索のロジックが複雑で、エラーハンドリングが分散
   - 影響: デバッグが困難、将来的な変更に弱い構造

#### ✅ 実施された修正

**1. デフォルトURLの修正** (docker-automation/server.js:17)
```javascript
// 修正前
const RESERVATION_URL = process.env.RESERVATION_URL || 'https://ckreserve.com/clinic/fujiminohikari-ganka';

// 修正後
const RESERVATION_URL = process.env.RESERVATION_URL || 'https://ckreserve.com/clinic/fujiminohikari-ganka/fujimino';
```

**2. カレンダー検出ロジックの全面改善** (docker-automation/server.js:80-126)

新しい関数 `waitForCalendarContext()` を導入：

- **メインページとiframeの両方に対応**: メインページを最初にチェックし、その後iframe内を探索
- **タイムアウト処理の統一**: 20秒のタイムアウトを一元管理
- **堅牢なエラーハンドリング**: クロスオリジンiframeなどアクセスできないframeを安全にスキップ
- **ポーリング方式**: 0.5秒ごとにチェックし、カレンダーが動的に読み込まれる場合にも対応

**修正前（約60行の複雑なループ処理）:**
```javascript
// iframe を順番に探索する複雑なロジック
for (let i = 0; i < frames.length; i++) {
  // 各frameごとにtry-catchでエラーハンドリング
  // カレンダー判定ロジックが分散
}
```

**修正後（シンプルで再利用可能な関数）:**
```javascript
const calendarFrame = await waitForCalendarContext(page);
if (!calendarFrame) {
  throw new Error('カレンダー要素が見つかりません');
}
```

#### 📈 改善効果

1. **正確性の向上**: URLが正しく設定され、意図したページに確実にアクセス
2. **保守性の向上**: コードが約60行から20行に削減、見通しが良く修正が容易
3. **柔軟性の向上**: メインページ/iframe両方に自動対応、将来の変更に強い
4. **デバッグの容易化**: エラー発生時の原因特定が簡単

#### 🎓 学びのポイント（後学のため）

1. **デフォルト値には完全なURLを指定する**: 省略形は予期しない動作の原因に
2. **複雑なロジックは関数に分離する**: テスト・デバッグ・再利用が容易に
3. **タイムアウトとポーリングを組み合わせる**: 動的コンテンツにも対応可能
4. **エラーハンドリングは一箇所に集約する**: 各所に散在させると管理が困難

---

### その他の最近の改善

- **2025年11月7日**: 画像ファイル名を英語化（国際化対応とメンテナンス性向上）
  - `休診日.png` → `closed_days.png`
  - `予約空きあり.png` → `vacant_reservation.png`
  - `予約がいっぱい.png` → `full_reservation.png`

- **2025年11月**: **iframe内カレンダー対応**（PR #23）
  - iframe内に埋め込まれたカレンダーでも正しく動作

- **2025年11月**: **広告フレーム除外**（PR #24）
  - 広告フレームを正しく除外して検出精度を向上

- **2025年11月**: **Docker自動化システムを実装**（PR #16）
  - Cloud Run対応の完全自動化システム

- **2025年11月**: **Chrome Web Store非公開公開の準備完了**（PR #14）
  - 非公開公開用のファイル一式を準備

---

## 📄 ライセンス

このプロジェクトは私的利用を目的としています。

---

## 📞 お問い合わせ

システムに関する質問や問題は、Issuesでお知らせください。
