# 予約状況自動更新システム

眼科クリニックの予約状況を自動判定し、ホームページのバナーに表示するシステムです。

## 🌐 デモ

**バナー表示：** https://nekonekoganka.github.io/reservation-status/

---

## 📌 主な機能

1. **Chrome拡張機能** - 予約ページから空き状況を自動判定
2. **Googleスプレッドシート連携** - 判定結果を自動記録
3. **GitHub Pagesバナー** - ホームページに埋め込み可能なバナー
4. **曜日・時間対応** - 火曜18:30以降は木曜、水曜は木曜をチェック
5. **自動データ管理** - 20,000行以上の古いデータを自動削除

---

## 🗂️ ディレクトリ構成

```
reservation-status/
├── index.html                  # バナー表示用HTML
├── docs/                       # ドキュメント
│   ├── handover-to-claude-code.md      # システム全体の引き継ぎ資料
│   ├── implementation-guide-v5.md      # 実装手順
│   └── delete-old-rows-guide.md        # データ管理設定
├── chrome-extension/           # Chrome拡張機能
│   ├── content.js
│   ├── manifest.json
│   ├── google-apps-script.js
│   ├── README.md
│   └── ICON_README.md
├── gas/                        # Google Apps Script
│   └── delete-old-rows-fixed.gs
└── bookmarklet/                # ブックマークレット（スマホ用）
    └── bookmarklet-v7.md
```

---

## 🚀 クイックスタート

### 1. Chrome拡張機能をインストール

```bash
1. chrome://extensions/ を開く
2. デベロッパーモードをON
3. 「パッケージ化されていない拡張機能を読み込む」
4. chrome-extension フォルダを選択
```

詳細：[chrome-extension/README.md](chrome-extension/README.md)

### 2. バナーをホームページに埋め込み

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

---

## 📊 動作フロー

```
予約ページ
    ↓
Chrome拡張機能（自動判定）
    ↓
Google Apps Script
    ↓
Googleスプレッドシート
    ↓
GitHub Pagesバナー（1分ごと更新）
```

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

- **PC:** Chrome拡張機能
- **スマホ:** ブックマークレット

---

## 🤝 開発者向け

### Claude Codeでの開発

このリポジトリはClaude Codeでの開発を想定しています。

**引き継ぎ資料：** [docs/handover-to-claude-code.md](docs/handover-to-claude-code.md)

---

## 📄 ライセンス

このプロジェクトは私的利用を目的としています。

---

## 📞 お問い合わせ

システムに関する質問や問題は、Issuesでお知らせください。
