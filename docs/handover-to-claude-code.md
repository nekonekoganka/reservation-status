# 予約状況自動更新システム - Claude Code 引き継ぎ資料

## 📌 プロジェクト概要

**目的：**
眼科クリニックの予約状況を自動判定し、ホームページのバナーに表示するシステム

**主な機能：**
1. Chrome拡張機能で予約ページから空き状況を自動判定
2. Googleスプレッドシートに記録
3. GitHub Pagesのバナーに自動表示
4. 曜日・時間帯に応じて適切な日付をチェック
5. スプレッドシートの古いデータを自動削除

---

## 🗂️ システム構成

### 1. Chrome拡張機能（PC用）
- **バージョン：** v6
- **機能：** 予約ページにボタンを追加、クリックで自動判定
- **場所：** ローカルPC

### 2. ブックマークレット（スマホ・PC用）
- **バージョン：** v7
- **機能：** Chrome拡張機能と同じ（ブックマークから実行）

### 3. Google Apps Script（GAS）
- **機能1：** Chrome拡張機能からのデータを受け取りスプレッドシートに記録
- **機能2：** 古い行を自動削除（20,000行以上）

### 4. GitHub Pages（バナー表示）
- **リポジトリ：** nekonekoganka/reservation-status
- **URL：** https://nekonekoganka.github.io/reservation-status/
- **機能：** スプレッドシートから最新データを取得して表示

### 5. Googleスプレッドシート
- **ID：** 1RSd9aC5B_-gQ1_j5V1aQcZn1iVw9v8mpmhJ78_8gY80
- **シート名：** フォームの回答 1
- **列構成：** A列=タイムスタンプ、B列=ステータス

---

## 🔧 技術仕様

### 日付判定ロジック

**チェックする日付の決定：**

1. **火曜18:30以降** → 木曜日の予約状況をチェック
2. **水曜日（終日）** → 木曜日の予約状況をチェック
3. **月末18:30以降** → 自動判定不可（フォームから手動入力）
4. **その他18:30以降** → 明日の予約状況をチェック
5. **18:30より前** → 本日の予約状況をチェック

**受付終了時刻：** 18:30
**休診日：** 毎週水曜日

### 予約ページのHTML構造

**URL：** https://ckreserve.com/clinic/fujiminohikari-ganka

**カレンダーのセル：**
```html
<td class="select-cell-available">4</td>  <!-- ◯：予約可能 -->
<td class="day-closed">5</td>              <!-- グレー：休診日 -->
<td class="day-full">6</td>                <!-- ×：満員 -->
```

**判定方法：**
- `select-cell-available` → 「空きあり」
- `day-closed` or `day-full` → 「「満」」

### Google Apps Script

**Web App URL：**
```
https://script.google.com/macros/s/AKfycbzIRL1XS4zVAwcAs8OKMhVDR-eC_amv2GPMW5-Y8dYr_UsA92-CZIAwKJvSyxWsAEDz/exec
```

**デプロイ設定：**
- 実行ユーザー：自分
- アクセス権限：全員

**トリガー：**
- 関数：deleteOldRows
- 頻度：毎週水曜日 午前3時〜4時
- 動作：20,000行を超えたら古い行を削除

---

## 📁 ファイル構成

### GitHub リポジトリ（nekonekoganka/reservation-status）

```
reservation-status/
├── index.html          # バナー表示用HTML
└── README.md          # リポジトリの説明
```

### Chrome拡張機能（chrome-extension-v6.zip）

```
chrome-extension/
├── manifest.json      # 拡張機能の設定
├── content.js         # メインロジック
├── google-apps-script.js  # GASのコード（参考用）
├── README.md          # 使い方
└── ICON_README.md     # アイコン設定方法
```

### Google Apps Script

**ファイル構成：**
```
Apps Script プロジェクト
├── コード.gs          # 既存：データ記録用
└── 古い行削除.gs      # 新規：古い行削除用
```

---

## 🔑 重要な設定値

### スプレッドシート
```javascript
const SPREADSHEET_ID = '1RSd9aC5B_-gQ1_j5V1aQcZn1iVw9v8mpmhJ78_8gY80';
const SHEET_NAME = 'フォームの回答 1';
```

### GAS Web App URL
```javascript
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzIRL1XS4zVAwcAs8OKMhVDR-eC_amv2GPMW5-Y8dYr_UsA92-CZIAwKJvSyxWsAEDz/exec';
```

### 予約ページURL
```javascript
const RESERVATION_URL = 'https://ckreserve.com/clinic/fujiminohikari-ganka';
```

### GitHub Pages URL
```
https://nekonekoganka.github.io/reservation-status/
```

### 行数上限
```javascript
const MAX_ROWS = 20000;
```

---

## 🎨 UI/UX仕様

### Chrome拡張機能のボタン

**通常時：**
- テキスト：「🔄 予約状況を更新する」
- 色：紫のグラデーション
- 位置：右下固定

**処理中：**
- テキスト：「⏳ 確認中...」
- 無効化：クリック不可

**成功時（7秒間表示）：**
- テキスト：「✅ 本日分: 空きあり」（日付に応じて変化）
- 色：緑のグラデーション

**月末時（7秒間表示）：**
- テキスト：「⚠️ 月末です フォームから入力してね」
- 色：オレンジのグラデーション

**エラー時（7秒間表示）：**
- テキスト：「❌ エラーが発生しました」
- 色：ピンクのグラデーション

### バナー表示

**予約可能時：**
- 背景色：青（#0056B3）
- テキスト：「✅ ◯◯分の予約枠 空きあり」
- サブテキスト：「ご予約いただけます」「クリックして予約ページへ」

**満員時：**
- 背景色：赤（#DC3545）
- テキスト：「🙇 ◯◯の予約は満枠です」
- サブテキスト：「大変申し訳ございません」「翌日以降でご予約ください」

**◯◯の部分：**
- 「本日」「明日」「木曜」「翌営業日」のいずれか（状況に応じて）

**クリック動作：**
- 予約ページ（https://ckreserve.com/clinic/fujiminohikari-ganka）を新しいタブで開く

---

## 📊 データフロー

### 1. 自動判定の流れ

```
1. Chrome拡張機能のボタンをクリック
   ↓
2. 現在の日時・曜日から対象日付を計算
   ↓
3. 予約ページのカレンダーから対象日付のセルを探す
   ↓
4. セルのクラス名で判定
   - select-cell-available → 「空きあり」
   - day-closed / day-full → 「「満」」
   ↓
5. タイムスタンプとステータスをGASに送信
   ↓
6. GASがスプレッドシートに記録
   ↓
7. バナーが1分以内に自動更新
```

### 2. バナー表示の流れ

```
1. GitHub Pagesが1分ごとに更新
   ↓
2. Google Sheets APIでスプレッドシートから全データ取得
   ↓
3. タイムスタンプが最新の行を特定
   ↓
4. 現在時刻・曜日から表示テキストを決定
   ↓
5. バナーを更新
```

### 3. 古い行削除の流れ

```
毎週水曜日 午前3時
   ↓
GASのトリガーが発動
   ↓
現在の行数をチェック
   ↓
20,000行以下 → 何もしない
20,000行超 → 古い行を削除（上から）
   ↓
ログに記録
```

---

## 🚀 デプロイ手順

### Chrome拡張機能

1. `chrome://extensions/` を開く
2. デベロッパーモードをON
3. 「パッケージ化されていない拡張機能を読み込む」
4. `chrome-extension` フォルダを選択

### Google Apps Script

**既存：データ記録用（すでに設定済み）**
- Web Appとしてデプロイ済み
- URL: https://script.google.com/.../exec

**新規：古い行削除用**
1. スプレッドシートで「拡張機能」→「Apps Script」
2. 新しいスクリプトファイル「古い行削除.gs」を作成
3. コードを貼り付け
4. トリガーを設定（毎週水曜 午前3時）

### GitHub Pages

1. GitHubリポジトリ：nekonekoganka/reservation-status
2. index.html を編集
3. Commit
4. 1〜2分で自動デプロイ

---

## ⚠️ 既知の制約・注意点

### 1. 月末の制約

**問題：**
予約カレンダーは「今月分」のみ表示される

**対応：**
- 月末18:30以降は自動判定不可
- Chrome拡張機能：ボタンに警告表示（7秒）
- ブックマークレット：静かに終了
- Googleフォームから手動入力が必要

### 2. スプレッドシートの行数

**現在の設定：**
- 上限：20,000行
- 保持期間：約1ヶ月分
- 削除タイミング：毎週水曜日 午前3時

**パフォーマンス：**
- 20,000行以下：問題なし
- 50,000行超：やや重くなる
- 100,000行超：かなり重い

### 3. バージョン管理

**重要：**
複数のPCで異なるバージョンの拡張機能を使うと、データが矛盾する

**対応：**
全PCを同じバージョン（v6）に統一する必要あり

### 4. 時刻の判定

**18:30の扱い：**
- 18:30ちょうど → 「明日」扱い
- 18:29 → 「本日」扱い

### 5. GASの実行制限

**無料版の制限：**
- 1日の実行時間：最大90分
- 1回の実行時間：最大6分

**2分ごとに実行する場合：**
- 1日720回 × 3秒 = 36分
- 無料枠内で十分 ✅

---

## 🔮 今後の検討事項

### 自動化の方式

**現在：** 手動でボタンをクリック

**検討中：**

#### 方式A：RPA（Power Automate Desktop など）
- メリット：簡単、すぐ実装可能
- デメリット：PC常時起動が必要、電気代
- コスト：月200〜1,000円

#### 方式B：GAS + クラウドサーバー（Google Cloud Run など）
- メリット：PC不要、安い、安定
- デメリット：実装が複雑
- コスト：月0〜300円

#### 方式C：n8n（セルフホスト）+ Puppeteer
- メリット：ワークフローが視覚的
- デメリット：複雑、サーバー管理が必要
- コスト：月$5〜10

**決定：** まだ検討中

---

## 📝 メンテナンス

### 定期的な確認事項

**毎日：**
- バナーが正しく表示されているか
- スプレッドシートに記録されているか

**毎週：**
- 水曜日の午前3時以降に行削除が実行されたか確認
- GASの実行ログをチェック

**毎月：**
- 月末の動作確認（フォームから手動入力）
- スプレッドシートの行数確認

### トラブルシューティング

**バナーが更新されない：**
1. スプレッドシートに最新データがあるか確認
2. スプレッドシートの共有設定を確認（リンクを知っている全員）
3. GitHub Pagesのキャッシュをクリア

**Chrome拡張機能が動かない：**
1. 拡張機能が有効になっているか確認
2. 予約ページのURLが正しいか確認
3. ブラウザのコンソールでエラーを確認

**GASがエラーになる：**
1. スプレッドシートIDが正しいか確認
2. シート名が「フォームの回答 1」か確認
3. 実行ログでエラー内容を確認

---

## 🔗 関連リンク

**予約ページ：**
https://ckreserve.com/clinic/fujiminohikari-ganka

**バナー表示：**
https://nekonekoganka.github.io/reservation-status/

**GitHubリポジトリ：**
https://github.com/nekonekoganka/reservation-status

**スプレッドシート：**
https://docs.google.com/spreadsheets/d/1RSd9aC5B_-gQ1_j5V1aQcZn1iVw9v8mpmhJ78_8gY80/edit

**Google Apps Script：**
スプレッドシートから「拡張機能」→「Apps Script」でアクセス

---

## 📞 引き継ぎ時の確認事項

### Claude Codeに依頼する際のチェックリスト

**□ GitHubリポジトリのアクセス権限**
- リポジトリURL: https://github.com/nekonekoganka/reservation-status
- Claude Codeがリポジトリを読み書きできるか確認

**□ 修正したいファイルの場所**
- index.html の修正 → GitHubリポジトリ
- content.js の修正 → ローカルのchrome-extensionフォルダ
- GASの修正 → スプレッドシートのApps Script

**□ 具体的な修正内容**
- 何を変更したいか明確に伝える
- 例：「バナーの色を変更」「判定ロジックを修正」

**□ テスト方法**
- 修正後のテスト手順を確認
- 動作確認のポイントを共有

---

## 💾 バックアップ

### 重要ファイルのバックアップ

**定期的にバックアップを取る：**

1. **Chrome拡張機能**
   - chrome-extension フォルダ全体をZIP
   - Googleドライブなどに保存

2. **Google Apps Script**
   - Apps Scriptで「バージョン」→「スナップショットを作成」

3. **スプレッドシート**
   - 「ファイル」→「コピーを作成」
   - 月1回程度

4. **GitHubリポジトリ**
   - GitHubが自動的にバージョン管理
   - 必要に応じてローカルにクローン

---

## 🎓 参考情報

### 使用している技術

- **JavaScript** - Chrome拡張機能、GAS、GitHub Pages
- **HTML/CSS** - バナー表示
- **Google Apps Script** - スプレッドシート連携
- **Google Sheets API** - データ取得
- **GitHub Pages** - 静的サイトホスティング

### ドキュメント

- Chrome拡張機能: https://developer.chrome.com/docs/extensions/
- Google Apps Script: https://developers.google.com/apps-script
- Google Sheets API: https://developers.google.com/sheets/api
- GitHub Pages: https://docs.github.com/pages

---

## ✅ 最終確認

この引き継ぎ資料を使ってClaude Codeに以下を依頼できます：

1. ✅ index.html の修正（バナー表示）
2. ✅ content.js の修正（拡張機能のロジック）
3. ✅ 新機能の追加
4. ✅ バグ修正
5. ✅ コードのリファクタリング

---

**作成日：** 2025年11月5日
**最終更新：** 2025年11月5日
**バージョン：** Chrome拡張機能v6、ブックマークレットv7、index.html v7
