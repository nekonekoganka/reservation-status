# Display Auto Reloader

display.htmlとdisplay-shiya.htmlを1分ごとに自動更新するChrome拡張機能

## 📌 概要

- **対象URL:**
  - https://nekonekoganka.github.io/reservation-status/display.html
  - https://nekonekoganka.github.io/reservation-status/display-shiya.html
- **更新間隔:** 1分（60秒）ごと
- **動作条件:** タブがアクティブでない状態でも更新を継続
- **制御方式:** 常に有効（オン/オフ切り替え機能なし）
- **UI:** バックグラウンドで静かに動作（通知・表示なし）

---

## 🗂️ ファイル構成

```
chrome-extension-auto-reload/
├── manifest.json        # 拡張機能の設定ファイル（Manifest V3）
├── background.js        # Service Worker（バックグラウンド処理）
├── content.js          # Content Script（ページ操作）
└── README.md           # このファイル
```

---

## 🔧 技術仕様

### Manifest V3

Chrome拡張機能の最新仕様に準拠

### 使用API

- **chrome.alarms:** 60秒ごとのアラーム設定
- **chrome.tabs:** タブの検索とリロード
- **chrome.runtime:** メッセージング

### 動作フロー

```
拡張機能インストール
  ↓
Service Worker起動
  ↓
60秒アラーム設定
  ↓
アラーム発火
  ↓
対象URLのタブを検索
  ↓
タブ発見 → Content Scriptにメッセージ送信
  ↓
location.reload() でページリロード
  ↓
60秒後に繰り返し
```

---

## 📦 インストール手順

### 1. Chrome拡張機能管理画面を開く

Chromeのアドレスバーに以下を入力：
```
chrome://extensions/
```

### 2. デベロッパーモードをオンにする

右上の「**デベロッパーモード**」トグルをオンにします。

### 3. 拡張機能を読み込む

1. 「**パッケージ化されていない拡張機能を読み込む**」ボタンをクリック
2. `chrome-extension-auto-reload/` フォルダを選択
3. 拡張機能が読み込まれます

### 4. インストール完了

拡張機能一覧に「**Display Auto Reloader**」が表示されます。

---

## ✅ 動作確認

### 1. 対象URLを開く

ブラウザで以下のいずれか（または両方）のURLを開きます：
```
https://nekonekoganka.github.io/reservation-status/display.html
https://nekonekoganka.github.io/reservation-status/display-shiya.html
```

### 2. 別のタブに切り替える

対象URLのタブを開いたまま、別のタブをアクティブにします。

### 3. 1分待つ

60秒後、対象URLのタブが自動的にリロードされることを確認します。

### 4. コンソールログを確認（任意）

対象URLのタブでデベロッパーツール（F12）を開き、コンソールを確認すると以下のログが表示されます：

```
Display Auto Reloader: Content Script が読み込まれました
Display Auto Reloader: 1分ごとに自動更新されます
Display Auto Reloader: リロード指示を受信しました
```

Service Workerのログを確認するには：
1. `chrome://extensions/` を開く
2. Display Auto Reloader の「**Service Worker**」リンクをクリック
3. コンソールに以下のようなログが表示されます：

```
Display Auto Reloader: インストールされました
Display Auto Reloader: アラームを設定しました（1分ごと）
Display Auto Reloader: アラーム発火 - リロードを実行します
Display Auto Reloader: 2個のタブを発見しました
Display Auto Reloader: タブID XX (https://nekonekoganka.github.io/reservation-status/display.html) にリロード指示を送信しました
Display Auto Reloader: タブID YY (https://nekonekoganka.github.io/reservation-status/display-shiya.html) にリロード指示を送信しました
```

---

## ⚙️ カスタマイズ

### 更新間隔を変更する

`background.js` の以下の部分を変更：

```javascript
// 更新間隔（分）
const RELOAD_INTERVAL_MINUTES = 1;  // ← この値を変更
```

例：
- `0.5` = 30秒ごと
- `2` = 2分ごと
- `5` = 5分ごと

変更後、拡張機能を再読み込みしてください。

### 対象URLを変更・追加する

`background.js` と `manifest.json` の両方を変更する必要があります。

**background.js:**
```javascript
// 対象URL（複数）
const TARGET_URLS = [
  'https://example.com/page1.html',  // ← 変更・追加
  'https://example.com/page2.html',  // ← 変更・追加
  'https://example.com/page3.html'   // ← 追加も可能
];
```

**manifest.json:**
```json
"content_scripts": [
  {
    "matches": [
      "https://example.com/page1.html",  // ← 変更・追加
      "https://example.com/page2.html",  // ← 変更・追加
      "https://example.com/page3.html"   // ← 追加も可能
    ],
    ...
  }
]
```

両方のファイルで同じURLを指定してください。

---

## 📝 注意事項

### ⚠️ 重要な制限

1. **タブがアクティブでなくても更新されます**
   - ユーザーが何か入力中でも更新が発生します
   - デバッグページでカスタマイズ中に更新されると、入力内容が失われる可能性があります

2. **対象URLが開かれていない場合は動作しません**
   - タブを閉じると更新は停止します

3. **複数のタブで対象URLを開いている場合**
   - すべてのタブが同時に更新されます

### 🔍 トラブルシューティング

#### 更新されない場合

1. **拡張機能が有効か確認**
   - `chrome://extensions/` で「Display Auto Reloader」が有効になっているか確認

2. **対象URLが正しいか確認**
   - URLが完全一致している必要があります
   - 例: `?` や `#` などのパラメータがあると一致しません

3. **Service Workerのログを確認**
   - `chrome://extensions/` → Service Worker をクリック
   - エラーメッセージがないか確認

4. **拡張機能を再読み込み**
   - `chrome://extensions/` → リロードボタンをクリック

#### アラームが動作しない場合

Service Workerのコンソールで以下のコマンドを実行：

```javascript
chrome.alarms.getAll((alarms) => {
  console.log('現在のアラーム:', alarms);
});
```

アラームが設定されているか確認できます。

---

## 🛑 アンインストール

1. `chrome://extensions/` を開く
2. Display Auto Reloader の「**削除**」ボタンをクリック
3. 確認ダイアログで「削除」をクリック

---

## 🔧 開発者向け情報

### デバッグモード

Service WorkerとContent Scriptの両方でconsole.logを使用してデバッグできます。

**Service Worker:**
- `chrome://extensions/` → Service Worker をクリック

**Content Script:**
- 対象URLのタブでF12を押してデベロッパーツールを開く

### エラーハンドリング

background.jsでは以下のフォールバック処理を実装：

1. Content Scriptへのメッセージ送信を試行
2. 失敗した場合、`chrome.tabs.reload()` で直接リロード

これにより、Content Scriptが読み込まれていない場合でもリロードが実行されます。

---

## 📜 ライセンス

このプロジェクトは私的利用を目的としています。

---

## 📞 お問い合わせ

問題が発生した場合は、GitHubの Issuesで報告してください。
