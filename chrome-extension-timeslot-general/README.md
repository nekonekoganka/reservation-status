# 予約枠数表示（一般）Chrome拡張機能

一般予約の空き枠数をChromeタスクバーにリアルタイム表示する拡張機能です。

## 📋 機能

### タスクバーアイコン表示
- **残り枠数を表示**: 太字の白い数字で枠数を表示
- **枠数0の場合**: 白い✕マークを表示
- **アイコンデザイン**: 2×2グリッド形式
  - 左上3マス: 状態に応じた背景色（緑=空きあり、赤=満枠、オレンジ=エラー）
  - 右下1マス: オレンジ色（#CC6600）+ 白文字「一」

### ポップアップ表示
アイコンをクリックすると、以下の情報を表示：
- 予約日情報（「本日」「明日」「木曜」など）
- 空き枠数（「残り5枠」など）
- 時間枠の詳細リスト
- 最終更新時刻
- 次回更新までのカウントダウン
- 手動更新ボタン

## 🔄 更新頻度
- **自動更新**: 1分ごと
- **手動更新**: ポップアップ内のボタンで即座に更新

## 📊 データソース
Cloud Storage JSONファイルから取得：
```
https://storage.googleapis.com/reservation-timeslots-fujiminohikari/timeslots.json
```

## 🚀 インストール方法

1. Chromeで `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」を有効化
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. このディレクトリ（`chrome-extension-timeslot-general`）を選択

## 📁 ファイル構成

```
chrome-extension-timeslot-general/
├── manifest.json      # 拡張機能の設定
├── background.js      # バックグラウンド処理・データ取得
├── popup.html         # ポップアップUI
├── popup.js           # ポップアップロジック
└── README.md          # このファイル
```

## 🔧 技術仕様

- **Manifest Version**: 3
- **使用API**:
  - Chrome Alarms API（定期更新）
  - Chrome Storage API（データ保存）
  - Canvas API（アイコン動的生成）
- **権限**:
  - `alarms`: 定期更新用
  - `storage`: データ保存用
  - `https://storage.googleapis.com/*`: データ取得用

## 📝 データ構造

Cloud StorageのJSONデータ形式：
```json
{
  "date": 5,
  "displayText": "本日",
  "slots": ["10:15", "11:00", "14:30"],
  "status": "available",
  "updatedAt": "2025-12-04T10:30:00Z"
}
```

## 🎨 デザイン仕様

### アイコンの背景色（左上3マス）
- 枠あり（slots.length > 0）: 緑色（#27ae60）
- 満枠（slots.length = 0）: 赤色（#dc3545）
- エラー: オレンジ色（#FFA500）

### 中央の表示内容
- 枠数 > 0: 枠数を太字の白い数字で表示
- 枠数 = 0: 白い✕マーク（線で描画）
- エラー時: 白い⚠マーク

## 📌 関連システム

- **データ生成システム**: `docker-timeslot-checker/`
- **視野予約版**: `chrome-extension-timeslot-shiya/`

## 📄 ライセンス

MIT License
