# 予約状況自動更新システム

眼科クリニックの予約状況を自動判定し、ホームページのバナーに表示するシステムです。

## 🌐 デモ

**バナー表示：** https://nekonekoganka.github.io/reservation-status/

---

## 📌 主な機能

1. **Chrome拡張機能** - 予約ページから空き状況を自動判定
2. **Docker自動化システム** - Cloud Runで5分ごとに完全自動実行 🆕
3. **Googleスプレッドシート連携** - 判定結果を自動記録
4. **GitHub Pagesバナー** - ホームページに埋め込み可能なバナー
5. **曜日・時間対応** - 火曜18:30以降は木曜、水曜は木曜をチェック
6. **自動データ管理** - 20,000行以上の古いデータを自動削除
7. **iframe対応** - iframe内のカレンダーも正しく検出 🆕

---

## 🗂️ ディレクトリ構成

```
reservation-status/
├── index.html                  # バナー表示用HTML
├── Downloads/                  # バナー用画像ファイル 🆕
│   ├── vacant_reservation.png  # 予約空きありバナー
│   ├── full_reservation.png    # 予約満バナー
│   └── closed_days.png         # 休診日バナー
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
├── chrome-web-store/           # Chrome Web Store公開用ファイル 🆕
│   ├── publishing-guide.md     # 公開手順ガイド
│   ├── store-listing.md        # ストア掲載情報
│   ├── privacy-policy.md       # プライバシーポリシー
│   └── screenshot-guide.md     # スクリーンショットガイド
├── docker-automation/          # Docker自動化システム 🆕
│   ├── server.js               # メインコード（Node.js + Puppeteer）
│   ├── Dockerfile              # Docker設定
│   ├── package.json            # 依存関係
│   └── README.md               # 詳細なデプロイ手順
├── gas/                        # Google Apps Script
│   └── delete-old-rows-fixed.gs
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

Cloud Runで5分ごとに自動実行（月額100〜300円）

```bash
# 詳細なセットアップ手順はこちら
docker-automation/README.md
```

- **メリット:** 完全自動、メンテナンス不要
- **デメリット:** わずかな費用が発生（月100〜300円）
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
