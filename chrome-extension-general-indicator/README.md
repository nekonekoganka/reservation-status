# 予約状況（一般）Chrome拡張機能

一般予約の空き状況をWindowsタスクバーで常時確認できるChrome拡張機能です。

## 🎯 機能

### アイコン表示

**2×2グリッドデザイン:**
- **左上3マス**: 予約状況
  - 🟢 緑: 空きあり
  - 🔴 赤 + 白バツ: 満枠
- **右下1マス**: オレンジ (#F57C00) + 白文字「一」（一般予約の識別）

### 自動更新

- **更新間隔**: 1分ごと
- **動作方式**: Service Worker（バックグラウンド）
- **データ元**: Googleスプレッドシート

## 📦 インストール方法

1. Chromeで `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」をONにする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `chrome-extension-general-indicator` フォルダを選択
5. Chromeアイコンをタスクバーにピン留め（推奨）

## 🎨 デザイン仕様

### カラー

| 要素 | カラー | 用途 |
|------|--------|------|
| 空き状態 | #27ae60（緑） | 予約可能 |
| 満枠状態 | #dc3545（赤） | 満枠 |
| 満枠マーク | 白（✕） | 満枠の強調 |
| テーマカラー | #F57C00（オレンジ） | 一般予約の識別 |
| 識別文字 | 白（一） | 一般予約の明示 |

### アイコンサイズ

- 128px: Chrome Web Store表示用
- 48px: 拡張機能バー用
- 16px: favicon用

## ⚙️ 技術仕様

- **Manifest Version**: 3
- **Background**: Service Worker
- **API**:
  - Chrome Alarms API (定期更新)
  - Chrome Storage API (状態保存)
  - Canvas API (アイコン動的生成)
- **データソース**: Google Sheets JSON API (`gviz/tq`)

## 🔧 設定

### スプレッドシート設定

```javascript
const SPREADSHEET_ID = '1RSd9aC5B_-gQ1_j5V1aQcZn1iVw9v8mpmhJ78_8gY80';
const SHEET_NAME = 'フォームの回答 1';
```

### 更新間隔

```javascript
const UPDATE_INTERVAL = 1; // 分
```

## 📊 動作フロー

```
1. Service Worker起動
   ↓
2. 1分ごとにアラーム発火
   ↓
3. Googleスプレッドシートから最新データ取得
   ↓
4. 予約状況を判定（空きあり / 満枠）
   ↓
5. Canvas APIでアイコンを動的生成
   - 2×2グリッド
   - 左上3マス: 緑 or 赤+白バツ
   - 右下1マス: オレンジ + 白文字「一」
   ↓
6. chrome.action.setIcon()でアイコン更新
   ↓
7. タスクバー上のChromeアイコンに反映
```

## 🎯 使い方

1. 拡張機能をインストール
2. Chromeをタスクバーにピン留め
3. タスクバー上のChromeアイコンを確認
   - 左上3マスが緑 → 予約できます
   - 左上3マスが赤+白バツ → 満枠です
   - 右下1マスのオレンジ「一」→ 一般予約

## 🚫 クリック機能について

この拡張機能にはクリック機能（ポップアップ）はありません。
アイコンの見た目だけで予約状況を確認するシンプル設計です。

## 📝 ログ確認

デベロッパーツールで Service Worker のログを確認できます：

1. `chrome://extensions/` を開く
2. 「予約状況（一般）」の「Service Worker」リンクをクリック
3. コンソールでログを確認

## ⚠️ トラブルシューティング

### アイコンが更新されない

1. 拡張機能を一度無効化して再度有効化
2. Service Workerのログを確認
3. ネットワーク接続を確認

### データが取得できない

- スプレッドシートのアクセス権限を確認
- スプレッドシートIDが正しいか確認
- シート名が正しいか確認

## 📦 完全無料

- GitHub Pages（無料）
- Google Sheets（無料）
- 追加コストなし

## 🔗 関連ファイル

- [視野予約インジケーター](../chrome-extension-shiya-indicator/)
- [統合インジケーター](../chrome-extension-status-indicator/)
- [自動リロード拡張機能](../chrome-extension-auto-reload/)
