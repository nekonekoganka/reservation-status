# 予約状況自動更新システム

眼科クリニックの予約状況を自動判定し、ホームページのバナーに表示するシステムです。

**対応予約:** 一般予約・視野予約の2種類の予約システムを独立して管理

---

## 🔗 クイックリンク集

### 📱 予約状況チェッカー（メイン）
- **[予約状況チェッカー](https://nekonekoganka.github.io/reservation-status/timeslot-status-checker.html)** ⭐推奨
  - 一般予約と視野予約を1画面で確認
  - **スマホモード**（800px以下）: コンパクトなカード表示
  - **壁掛けモード**（801px以上）: vw単位で自動スケール、クリニック入口用
  - 2本構成タイムラインバー（午前10〜13時/午後15〜18時）
  - 空き枠を白抜きドット○で可視化
  - タップで空き時間の詳細リスト表示

### 🖥️ タイムスロット表示（iframe埋め込み用）

#### 一般予約
- **[タイムスロット表示（一般）](https://nekonekoganka.github.io/reservation-status/timeslot-display.html)**
  - 空き時間枠を「・」区切りで表示
  - デバッグパネルで表示数をカスタマイズ可能（Dキー）

#### 視野予約
- **[タイムスロット表示（視野）](https://nekonekoganka.github.io/reservation-status/timeslot-display-shiya.html)**
  - 視野予約の空き時間枠を表示
  - デバッグパネルで表示数をカスタマイズ可能（Dキー）

### 🏷️ バナー表示（ホームページ埋め込み用）

- **[タイムスロットバナー（一般）](https://nekonekoganka.github.io/reservation-status/timeslot-banner.html)**
  - 残り枠数+具体的な時間枠を表示（例：[10:00] [11:00] [14:00] ほか）
  - 日付表示付き（例：本日（12/6））
  - Cloud Storageから取得

---

## 📌 主な機能

1. **予約状況チェッカー（メイン）** - スマホ/壁掛けの2モード対応
   - 2本構成タイムラインバー（午前/午後）
   - 白抜きドットで空き枠を可視化
   - 動的ラベル拡張（13時台/18時台の枠がある場合）
2. **Chrome拡張機能（3種類）**
   - **予約枠数表示拡張機能** - タスクバーに枠数を数字で表示（一般・視野）
   - ディスプレイ自動リロード拡張機能
3. **Docker自動化システム** - Cloud Runで自動実行（タイムスロット抽出）
4. **タイムスロット表示システム** - 空き時間枠を詳細に表示（iframe埋め込み用）
5. **GitHub Pagesバナー** - ホームページに埋め込み可能なバナー
6. **曜日・時間対応** - 火曜18:30以降は木曜、水曜は木曜をチェック

---

## 🗂️ ディレクトリ構成

```
reservation-status/
├── timeslot-status-checker.html    # ⭐メイン: 予約状況チェッカー（スマホ/壁掛け2モード）
├── timeslot-banner.html            # バナー: タイムスロット表示（iframe埋め込み用）
├── timeslot-display.html           # 一般予約: 時間枠を抽出して表示
├── timeslot-display-shiya.html     # 視野予約: 時間枠を抽出して表示
├── chrome-extension-timeslot-general/  # Chrome拡張機能（一般予約枠数表示）
├── chrome-extension-timeslot-shiya/    # Chrome拡張機能（視野予約枠数表示）
├── chrome-extension-auto-reload/   # Chrome拡張機能（ディスプレイ自動リロード）
├── chrome-web-store/           # Chrome Web Store公開用ファイル
├── docker-timeslot-checker/    # 一般予約: タイムスロット抽出システム（Cloud Run）
├── docker-timeslot-checker-shiya/  # 視野予約: タイムスロット抽出システム（Cloud Run）
├── docs/                       # ドキュメント
│   └── handover-to-claude-code.md  # システム全体の引き継ぎ資料
└── Downloads/                  # バナー用画像ファイル・設定ファイル
```

---

## 🚀 クイックスタート

### Docker自動化（完全自動）【おすすめ】

Cloud Runで自動実行（タイムスロット抽出）

- **メリット:** 完全自動、メンテナンス不要
- **デメリット:** わずかな費用が発生（月20〜40円）
- **Google Cloudプロジェクト:**
  - プロジェクト番号: 224924651996
  - プロジェクト ID: forward-script-470815-c5
- 詳細：[docker-timeslot-checker/README.md](docker-timeslot-checker/README.md)

---

### バナーをホームページに埋め込み

#### タイムスロット版（時間枠表示）
```html
<iframe
  src="https://nekonekoganka.github.io/reservation-status/timeslot-banner.html"
  width="100%"
  height="280"
  frameborder="0"
  scrolling="no"
  style="border:none;">
</iframe>
```

**表示例:**
- 空き枠あり: 「✅ 本日（12/6）の予約枠　10:00  11:00  14:00  ほか　に 空きがございます」
- 満枠: 「😔 本日（12/6）は満枠です」

#### 応急措置版（夜間の誤表示対策）

19〜23時台の0〜30分に発生する日付判定問題を回避するため、該当時間帯はバナーを非表示にします。

```html
<div id="reservation-banner-container">
  <iframe
    src="https://nekonekoganka.github.io/reservation-status/timeslot-banner.html"
    width="100%"
    height="280"
    frameborder="0"
    scrolling="no"
    style="border:none;">
  </iframe>
</div>

<script>
function checkAndHideBanner() {
  var now = new Date();
  var hour = now.getHours();
  var minute = now.getMinutes();
  var container = document.getElementById('reservation-banner-container');

  // 19時〜23時台で、0分〜30分の間は非表示
  if (hour >= 19 && hour <= 23 && minute >= 0 && minute <= 30) {
    container.style.display = 'none';
  } else {
    container.style.display = 'block';
  }
}

// ページ読み込み時と1分ごとにチェック
checkAndHideBanner();
setInterval(checkAndHideBanner, 60000);
</script>
```

---

## 📖 ドキュメント

- **[システム全体の説明](docs/handover-to-claude-code.md)** - 完全な引き継ぎ資料

---

## 🔧 技術スタック

- **Frontend:** HTML, CSS, JavaScript
- **Data Storage:** Cloud Storage (JSON)
- **Hosting:** GitHub Pages
- **Browser Extension:** Chrome Extension (Manifest V3)
- **Automation:** Node.js, Puppeteer, Docker
- **Cloud Platform:** Google Cloud Run, Cloud Scheduler, Cloud Storage
  - プロジェクト番号: 224924651996
  - プロジェクト ID: forward-script-470815-c5

---

## 📊 動作フロー

```
Cloud Scheduler（定期実行）
    ↓
Cloud Run（Puppeteer）
    ↓ (時間枠抽出)
Cloud Storage（JSON）
    ↓
GitHub Pages（バナー・ディスプレイ・チェッカー）
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

### Cloud Storage

```javascript
const BUCKET_NAME = 'reservation-timeslots-fujiminohikari';
const FILE_NAME_GENERAL = 'timeslots.json';
const FILE_NAME_SHIYA = 'timeslots-shiya.json';
```

### 予約ページURL

```
一般予約: https://ckreserve.com/clinic/fujiminohikari-ganka/fujimino
視野予約: https://ckreserve.com/clinic/fujiminohikari-ganka/fujiminohikari
```

---

## 📅 日付判定ロジック

- **火曜18:30以降** → 木曜日をチェック
- **水曜日（終日）** → 木曜日をチェック
- **月末18:30以降** → 翌月1日をチェック
- **年末年始（12/31〜1/3）** → 営業再開日をチェック
- **その他18:30以降** → 明日をチェック
- **18:30より前** → 本日をチェック

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

### 2025年12月7日 - タイムラインバー2本構成と白抜きドット 🆕

#### 📊 タイムラインバーの大幅改善

**概要:**
予約状況チェッカーとChrome拡張機能のタイムラインバーを、より見やすい2本構成（午前/午後）に変更し、ドットを白抜きスタイルに統一しました。

**1. 2本構成タイムラインバー**
```
午前バー: 10:00〜13:00（13時台の枠があれば14:00まで拡張）
午後バー: 15:00〜18:00（18時台の枠があれば18:30まで拡張）
```
- 午前は青系（#e8f4fc）、午後はオレンジ系（#fdf2e9）の背景
- 動的ラベル拡張機能で遅い時間帯も対応

**2. 白抜きドット**
```css
background: white;
border: 3px solid [テーマカラー];
```
- 白い中心＋太いテーマカラー枠線
- 「空きがある」ことを視覚的に表現
- 一般予約: オレンジ（#CC6600）、視野予約: 緑（#006633）

**3. 適用範囲**
- `timeslot-status-checker.html` - メインの予約状況チェッカー
- Chrome拡張機能（一般・視野）のポップアップ

**変更ファイル:**
- `timeslot-status-checker.html`
- `chrome-extension-timeslot-general/popup.html`, `popup.js`
- `chrome-extension-timeslot-shiya/popup.html`, `popup.js`

---

### 2025年12月7日 - 旧スプレッドシートシステムのファイル削除

**概要:**
旧スプレッドシート経由の予約判定システムで使用していたファイルを完全に削除しました。

**削除したHTMLファイル（9件）:**
- `index.html`, `shiya.html` - 旧バナー
- `mobile-status.html` - 旧モバイルチェッカー
- `display.html`, `display-shiya.html`, `display-combined.html` - 旧全画面ディスプレイ
- `display-test.html`, `display-test-shiya.html`, `display-test-combined.html` - 旧デバッグページ

**削除したその他ファイル（6件）:**
- `Downloads/20251109.txt` - 旧GASコード
- `Downloads/display-preset.json` - 旧デバッグページ用プリセット
- `docs/delete-old-rows-guide.md`, `docs/delete-old-rows-shiya-guide.md` - 旧スプレッドシート用ガイド
- `docs/implementation-guide-v5.md` - 旧v5システム実装ガイド

**効果:** 15ファイル、17,171行を削減

---

### 2025年12月6日 - 予約状況チェッカー2モード構成

**概要:**
予約状況チェッカーを、スマホモード（800px以下）と壁掛けモード（801px以上）の2モード構成に簡素化しました。これにより、旧来の全画面ディスプレイ（display.html等）は不要になりました。

**スマホモード（800px以下）:**
- max-width: 700pxのコンパクトなカード表示
- タップで詳細リスト展開

**壁掛けモード（801px以上）:**
- vw単位で自動スケール
- クリニック入口のディスプレイに最適
- 2カラムレイアウト（一般/視野を横並び）

---

### 2025年12月6日 - 旧システム削除とバナーUI改善

#### 🗑️ 旧システムの完全削除

**概要:**
タイムスロット抽出システムへの移行完了に伴い、旧システム（スプレッドシート経由の判定システム）を完全に削除しました。

**削除したCloud Runサービス:**
- `reservation-checker` - 旧一般予約チェッカー
- `reservation-checker-shiya` - 旧視野予約チェッカー

**削除したCloud Schedulerジョブ:**
- `check-reservation` - 旧一般予約の定期実行
- `check-reservation-shiya` - 旧視野予約の定期実行

**削除したディレクトリ（39ファイル、5,690行）:**
- `bookmarklet/` - ブックマークレット版チェッカー
- `docker-automation/` - 旧一般予約Docker自動化
- `docker-automation-shiya/` - 旧視野予約Docker自動化
- `chrome-extension/` - 旧Chrome拡張機能（ステータス表示）
- `chrome-extension-status-indicator/` - 旧ステータス表示拡張機能
- `chrome-extension-general-indicator/` - 旧一般予約インジケーター
- `chrome-extension-shiya-indicator/` - 旧視野予約インジケーター
- `gas/` - Google Apps Script

**効果:**
- リポジトリがシンプルになり、メンテナンス性が向上
- Cloud Runの運用コスト削減
- 新システム（タイムスロット抽出）への完全移行完了

#### 🎨 タイムスロットバナーのUI改善

**概要:**
`timeslot-banner.html`のUIを大幅に改善し、より見やすく使いやすいデザインに更新しました。

**1. 時間枠の個別ピル表示**
```
修正前: 10:00・11:00・14:00…
修正後: [10:00] [11:00] [14:00] ほか
```
- 個別の角丸ボックス（ピル）で時間枠を表示
- 白背景 + オレンジ枠線（#CC6600）でアクセント
- 「…」を「ほか」に変更

**2. 日付形式の変更**
```
修正前: 本日（土）
修正後: 本日（12/6）
```
- 曜日ではなく月/日形式で表示
- より具体的で分かりやすい日付表示

**3. モバイル表示の改善**
- 幅: `calc(100% - 10px)`で画面いっぱいに表示
- 高さ: iframe埋め込み時280pxで更新時刻まで表示
- 「ほか」がピルと同じ行に並ぶように修正（`align-items: center`）

**変更ファイル:**
- `timeslot-banner.html` - ピルデザイン、日付形式、モバイル対応

---

### 2025年12月5日 - タイムゾーン問題の修正とCloud Run運用改善

#### 🕐 18:30以降の時間判定が正しく動作しない問題を修正

**問題:**
一般予約のタイムスロット取得システムで、18:30以降でも「本日」の予約枠を参照してしまう問題が発生していました。視野予約は正常に動作していました。

**症状:**
- 18:30以降の毎時0〜30分 → 誤って「本日」を参照
- 18:30以降の毎時31〜59分 → 正しく「翌営業日」を参照
- 30分周期で動作が変わる不思議な現象

**原因:**
1. **古いリビジョンがCloud Runに残っていた** - 複数のリビジョンが存在し、一部のリクエストが古いコード（タイムゾーン修正前）に当たっていた
2. **タイムゾーン処理の環境依存** - `process.env.TZ` や `toLocaleString` がCloud Run環境で不安定だった
3. **メモリ不足** - 512MBではPuppeteerがメモリ不足でクラッシュし、インスタンスの再起動が発生していた

**修正内容:**

**1. 日本時間取得関数をUTCオフセット方式に変更**
```javascript
function getJapanTime() {
  const now = new Date();

  // 日本時間はUTC+9時間（環境に依存しない確実な方法）
  const japanOffset = 9 * 60 * 60 * 1000;
  const japanTime = new Date(now.getTime() + japanOffset);

  // UTCメソッドを使って日本時間の各値を取得
  const year = japanTime.getUTCFullYear();
  const month = japanTime.getUTCMonth() + 1;
  const date = japanTime.getUTCDate();
  const hour = japanTime.getUTCHours();
  const minute = japanTime.getUTCMinutes();

  return { year, month, date, dayOfWeek, hour, minute };
}
```

**2. Cloud Runのリビジョン整理**
- 古いリビジョン4つを削除
- 最新リビジョンに100%トラフィックを割り当て

**3. メモリを1GBに増加**
```bash
gcloud run deploy timeslot-checker \
  --memory 1Gi \
  --region asia-northeast1
```

**変更ファイル:**
- `docker-timeslot-checker/server.js` - getJapanTime()関数を追加
- `docker-timeslot-checker-shiya/server.js` - 同様の修正
- `docker-timeslot-checker/Dockerfile` - GPGキー修正を追加
- `docker-timeslot-checker-shiya/Dockerfile` - 同様の修正

#### 🔑 Google Chrome GPGキーエラーの修正

**問題:**
`gcloud builds submit` 実行時に以下のエラーが発生：
```
E: The repository 'https://dl-ssl.google.com/linux/chrome/deb stable InRelease' is not signed.
```

**原因:**
Puppeteerイメージ（ghcr.io/puppeteer/puppeteer:22.0.0）内のGoogle Chrome GPGキーが古くなっていた。

**修正:**
Dockerfileに以下を追加：
```dockerfile
# Google Chrome GPGキーを更新（古いキーが期限切れになる問題を回避）
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
```

#### 🖼️ Chrome拡張機能アイコンに枠線を追加

**概要:**
タイムスロット表示用のChrome拡張機能（一般予約・視野予約）のアイコンに、視認性向上のための枠線を追加しました。

**変更内容:**
- 白背景の外側に8%幅の枠線を追加
- 一般予約: オレンジ色（#CC6600）
- 視野予約: 緑色（#006633）

**実装コード:**
```javascript
const borderWidth = Math.max(1, Math.round(size * 0.08));
ctx.strokeStyle = themeColor;
ctx.lineWidth = borderWidth;
ctx.strokeRect(borderWidth / 2, borderWidth / 2, size - borderWidth, size - borderWidth);
```

**変更ファイル:**
- `chrome-extension-timeslot-general/background.js`
- `chrome-extension-timeslot-shiya/background.js`

---

### 🛠️ トラブルシューティング：Cloud Run運用のポイント

#### リビジョン管理

Cloud Runは複数のリビジョン（バージョン）を保持できます。古いリビジョンが残っていると、一部のリクエストが古いコードに当たる可能性があります。

**確認方法:**
```bash
gcloud run revisions list --service timeslot-checker --region asia-northeast1
```

**最新リビジョンに100%トラフィックを割り当て:**
```bash
gcloud run services update-traffic timeslot-checker --to-latest --region asia-northeast1
```

**デプロイ後の推奨手順:**
```bash
# 1. ビルド
gcloud builds submit --tag gcr.io/$(gcloud config get-value project)/timeslot-checker

# 2. デプロイ（メモリ1GB指定）
gcloud run deploy timeslot-checker \
  --image gcr.io/$(gcloud config get-value project)/timeslot-checker \
  --region asia-northeast1 \
  --platform managed \
  --memory 1Gi

# 3. トラフィックを最新に
gcloud run services update-traffic timeslot-checker --to-latest --region asia-northeast1
```

#### メモリ設定

Puppeteerを使用するサービスは、512MBでは不足する場合があります。

**推奨設定:**
- **最小:** 1GB（`--memory 1Gi`）
- メモリ不足エラー: `Memory limit of 512 MiB exceeded`

#### タイムゾーン

Cloud Run環境でのタイムゾーン処理は環境依存のため、以下の方式を推奨：

**推奨:** UTCオフセット方式
```javascript
const japanOffset = 9 * 60 * 60 * 1000;
const japanTime = new Date(now.getTime() + japanOffset);
```

**非推奨:** 環境変数依存
```javascript
process.env.TZ = 'Asia/Tokyo'; // 効果が不安定
```

---

### 2025年12月5日 - 日付表示の統一と時間枠バナーの追加

#### 📅 統一的な日付表示の実装

**概要:**
Chrome拡張機能と予約状況チェッカーに、日付を含む統一的な表示を実装しました。一般予約と視野予約で表示が異なる問題を解決し、「明日（12/6）」のように日付を明示することでユーザーにわかりやすくなりました。

**実装した機能:**

**1. 日付付き表示**
```
修正前: "次の診療日 残り5枠" または "明日 ✕ 満枠"
修正後: "次の診療日（12/9） 残り5枠" または "明日（12/6） ✕ 満枠"
```

**2. 表示の統一ロジック**
```javascript
function calculateDisplayTextWithDate(targetDate) {
  // dateフィールドから本日/明日/次の診療日を自動判定
  if (targetDate === currentDate) → "本日（MM/DD）"
  else if (targetDate === currentDate + 1) → "明日（MM/DD）"
  else → "次の診療日（MM/DD）"
}
```

**3. 問題の解決**

**修正前の問題:**
```
一般予約: date=6, displayText="次の診療日"
視野予約: date=6, displayText="明日"
→ 同じ日付なのに異なる表示！
```

**修正後:**
```
一般予約: "明日（12/6）"
視野予約: "明日（12/6）"
→ dateフィールドから計算するので統一表示！
```

**変更ファイル:**
- `chrome-extension-timeslot-general/popup.js` - 日付計算ロジック追加
- `chrome-extension-timeslot-shiya/popup.js` - 同様の修正
- `timeslot-status-checker.html` - 一般・視野両方に適用

**改善効果:**
1. ✅ 一般と視野で表示が統一される
2. ✅ 日付が明確になり、ユーザーにわかりやすい
3. ✅ JSONのdisplayTextの不統一が自動修正される
4. ✅ 月またぎも自動対応（12月31日→1月1日など）

#### 🏷️ タイムスロットバナーの追加

**概要:**
iframe埋め込み用のタイムスロット版バナーを新規作成しました。具体的な時間枠を表示することで、より詳細な予約情報を提供できます。

**新規作成ファイル:**
- `timeslot-banner.html` - タイムスロット版iframeバナー

**主な機能:**

**表示内容（空き枠がある場合）:**
```
✅ 明日の予約
10:00・11:00・14:00…
に 空きがございます
クリックして予約ページへ
更新：2025/12/05 14:30
```

**表示内容（満枠の場合）:**
```
😔 本日（12/5）の予約は 満枠です
誠に恐れ入りますが、次の診療日以降で ご予約ください
クリックして 予約ページへ
更新：2025/12/05 14:30
```

**技術仕様:**
- **データソース**: Cloud Storage JSON (`timeslots.json`)
- **表示数**: 最大3つの時間枠（それ以上は「…」）
- **更新頻度**: 1分ごとに自動更新
- **デザイン**: 従来版index.htmlと同じコンパクトなバナー形式
- **レスポンシブ**: スマホ・タブレット対応

**iframe埋め込みコード:**
```html
<iframe
  src="https://nekonekoganka.github.io/reservation-status/timeslot-banner.html"
  width="100%"
  height="280"
  frameborder="0"
  scrolling="no"
  style="border:none;">
</iframe>
```

**改善効果:**
1. ✅ 具体的な時間枠を表示できる
2. ✅ 日付表示で対象日が明確
3. ✅ 従来版と同じサイズで置き換え可能
4. ✅ Cloud Storageから最新データを取得

---

### 2025年12月5日 - 時間枠表示システムの大幅拡張

#### 🎯 タイムスロット対応の予約状況チェッカーとChrome拡張機能

**概要:**
時間枠（タイムスロット）を数字で表示する新しいシステムを実装しました。○/×だけでなく、「残り何枠」かを具体的に表示し、詳細な空き時間リストも確認できます。

**新規作成ファイル:**

**1. 時間枠対応の予約状況チェッカー**
- `timeslot-status-checker.html` - 一般予約と視野予約の枠数と詳細を表示

**2. Chrome拡張機能（枠数表示版）**
- `chrome-extension-timeslot-general/` - 一般予約の枠数を表示
  - manifest.json, background.js, popup.html, popup.js, README.md
- `chrome-extension-timeslot-shiya/` - 視野予約の枠数を表示
  - manifest.json, background.js, popup.html, popup.js, README.md

**3. タイムスロット表示のデバッグパネル**
- `timeslot-display.html` - デバッグパネル追加（Dキーで開閉）
- `timeslot-display-shiya.html` - デバッグパネル追加（Dキーで開閉）

**主な機能:**

**1. 予約状況チェッカー（timeslot-status-checker.html）**
- 枠数を数字で表示（例：「残り5枠」「残り3枠」）
- タップして時間枠の詳細リストを表示/非表示
- モバイルフレンドリーなカードレイアウト
- Cloud Storage JSONから30秒ごとに自動更新

**2. Chrome拡張機能（枠数表示版）**

**表示方式:**
- タスクバーアイコンに枠数を**太字の白い数字**で表示
- 枠数0の場合は白い✕マーク
- 2×2グリッドアイコン（既存デザインを踏襲）

**アイコンクリック時:**
- 予約日情報（「本日」「明日」「木曜」）
- 残り枠数
- 空き時間の詳細リスト（✅付き）
- 最終更新時刻
- 次回更新カウントダウン
- 手動更新ボタン

**データソース:**
- Cloud Storage JSON（1分ごとに自動更新）
- 一般: `timeslots.json`
- 視野: `timeslots-shiya.json`

**3. デバッグパネル（タイムスロット表示用）**

**機能:**
- **Dキー**または右下の🔧ボタンで開閉
- **表示する時間枠の数**をカスタマイズ（1〜20個）
- デフォルト: 3個（従来と同じ）
- 設定はlocalStorageに保存
- 一般と視野で独立した設定

**使い方:**
```
1. Dキーを押してデバッグパネルを開く
2. 「表示する時間枠の数」を入力（1〜20）
3. 「💾 保存」ボタンをクリック
4. 即座に表示が更新される
```

**技術実装:**

**タイムスロット表示ロジック:**
```javascript
// デバッグ設定から表示する時間枠の数を取得
const settings = loadDebugSettings();
const maxSlots = settings.maxSlots; // デフォルト: 3

// 時間枠を「・」で区切って表示
let timeslotsText;
if (data.slots.length > maxSlots) {
    timeslotsText = data.slots.slice(0, maxSlots).join('・') + '…';
} else {
    timeslotsText = data.slots.join('・');
}
```

**Chrome拡張機能のアイコン生成:**
```javascript
// Canvas APIで枠数を太字の白い数字で表示
if (slotsCount > 0) {
    const fontSize = slotsCount >= 10 ? size * 0.5 : size * 0.6;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = 'white';
    ctx.fillText(slotsCount.toString(), size / 2, size / 2);
}
```

**予約状況チェッカーの折りたたみ式リスト:**
```javascript
// カードタップで詳細表示/非表示を切り替え
function toggleTimeslots(type) {
    const container = document.getElementById(`timeslots-${type}`);
    container.classList.toggle('expanded');
}
```

#### 📈 改善効果

1. **具体的な情報表示**: ○/×だけでなく「残り何枠」かを数字で表示
2. **詳細な時間確認**: タップやクリックで空き時間の詳細リストを確認可能
3. **柔軟なカスタマイズ**: デバッグパネルで表示する時間枠の数を自由に調整
4. **モバイル対応**: スマホ・タブレットでも使いやすいUI
5. **既存システムとの統合**: Cloud Storageを通じてタイムスロット抽出システムと連携

#### 📁 変更ファイル
- `timeslot-status-checker.html` - 新規作成（578行）
- `chrome-extension-timeslot-general/` - 新規ディレクトリ
  - manifest.json, background.js (289行), popup.html (220行), popup.js (183行), README.md
- `chrome-extension-timeslot-shiya/` - 新規ディレクトリ
  - manifest.json, background.js (289行), popup.html (220行), popup.js (183行), README.md
- `timeslot-display.html` - デバッグパネル追加（+200行）
- `timeslot-display-shiya.html` - デバッグパネル追加（+200行）
- `README.md` - リンク集追加、新システムの説明追加

---

### 2025年11月27日 - 背景点滅機能の実装と速度調整の改善

#### 💡 通行人訴求に最適化された背景点滅システム

**概要:**
デバッグページに背景点滅機能を実装し、通行人の注目を集めるための効果的なアニメーション機能を追加しました。背景のみを点滅させる技術により、テキストやアイコンの視認性を保ちながら目を引く演出が可能になりました。

**更新ファイル:**
- `display-test.html` - 背景点滅機能の実装と改善
- `display-test-shiya.html` - 同機能の実装
- `display-test-combined.html` - 同機能の実装

**実装された機能:**

**1. 背景のみを点滅させる仕組み**
- **CSS ::before疑似要素**: オーバーレイ方式で背景のみをアニメーション
- **z-indexレイヤリング**: 背景層（z-index: 1）とコンテンツ層（z-index: 2）を分離
- **技術的メリット**: テキストやアイコンはそのままで、背景だけが点滅

**実装コード:**
```css
.display-container::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none;
    opacity: 0;
    z-index: 1;
}
.display-container > * {
    position: relative;
    z-index: 2;
}
```

**2. 3つの点滅モード**
- **明るく（brighten）**: 白いオーバーレイで背景を明るく点滅
- **暗く（darken）**: 黒いオーバーレイで背景を暗く点滅
- **白フラッシュ（flash-white）**: 最も目を引く強力な効果、通行人訴求に最適

**3. 2つの点滅パターン**
- **なめらか（pulse）**: ease-in-outでゆっくりと点滅（落ち着いた印象）
- **パチパチ（flash）**: steps(2)で瞬間的に点滅（強いインパクト）

**4. 速度調整機能の段階的改善**

**第1段階（コミット c71dd13）:**
- 3つのボタン（遅い/普通/速い）で速度を選択
- 固定値: 3.0秒 / 1.5秒 / 0.8秒

**第2段階（コミット a71e305）:**
- スライダーバー + 数値入力のデュアルモード実装
- 速度範囲: 0.3秒 〜 5.0秒（0.1秒刻み）
- トグルボタンで入力方法を切り替え可能
- より細かい調整が可能に

**スライダー/数値入力切り替え:**
```javascript
function toggleSpeedInputMode() {
    customizeState.bgBlinkSpeedInputMode = !customizeState.bgBlinkSpeedInputMode;
    if (customizeState.bgBlinkSpeedInputMode) {
        // 数値入力モード
        sliderContainer.style.display = 'none';
        inputContainer.style.display = 'block';
    } else {
        // スライダーモード
        sliderContainer.style.display = 'block';
        inputContainer.style.display = 'none';
    }
}
```

**5. 強度調整**
- スライダーで点滅の強さを調整（0.1 〜 0.8）
- オーバーレイの透明度をCSS変数で動的に制御
- 状況に応じて控えめ〜強めまで調整可能

**6. 動的スタイル注入**
```javascript
function applyBgBlinkEffect() {
    const style = document.createElement('style');
    style.id = 'bgBlinkStyle';
    style.textContent = `
        #displayContainer::before {
            background: ${overlayColor};
            animation: ${animationName} ${duration} ease-in-out infinite;
        }
    `;
    document.head.appendChild(style);
}
```

**アニメーション1タブのUI:**
- **ON/OFFトグル**: 背景点滅の有効/無効
- **モード選択**: 明るく / 暗く / 白フラッシュ（3つのボタン）
- **パターン選択**: なめらか / パチパチ（2つのボタン）
- **速度調整**: スライダーまたは数値入力（トグルで切替）
  - 範囲: 0.3秒（超高速）〜 5.0秒（ゆっくり）
- **強度調整**: スライダー（0.1 〜 0.8）
- **ヒント表示**: 「目を引きたい時に有効ですが、長時間表示では控えめ設定がおすすめです」

**カスタマイズ状態の保存:**
```javascript
customizeState: {
    bgBlinkEnabled: false,
    bgBlinkMode: 'brighten',  // 'brighten', 'darken', 'flash-white'
    bgBlinkPattern: 'pulse',  // 'pulse', 'flash'
    bgBlinkSpeed: 1.5,  // 0.3〜5.0秒
    bgBlinkSpeedInputMode: false,  // false: スライダー, true: 数値入力
    bgBlinkIntensity: 0.3,
}
```

#### 📈 改善効果

1. **通行人訴求力の向上**: 白フラッシュモードで遠くからでも注目を集める
2. **柔軟な調整**: 状況に応じて速度・強度・パターンを細かく調整可能
3. **視認性の維持**: 背景のみ点滅するため、テキストやアイコンは常に読みやすい
4. **直感的なUI**: スライダーと数値入力を切り替えて、好みの方法で設定
5. **設定の永続化**: localStorageに保存され、リロード後も設定を保持

#### 🎯 推奨設定

**通行人を呼び込みたい時:**
- モード: 白フラッシュ
- パターン: パチパチ
- 速度: 0.8秒（速め）
- 強度: 0.5〜0.7（中〜強）

**営業時間中の控えめ表示:**
- モード: 明るく or 暗く
- パターン: なめらか
- 速度: 2.0秒（ゆっくり）
- 強度: 0.2〜0.3（弱め）

#### 📁 変更ファイル
- `display-test.html` - 背景点滅機能の実装（約200行追加）
- `display-test-shiya.html` - 同機能の実装
- `display-test-combined.html` - 同機能の実装
- `README.md` - 背景点滅機能のドキュメント追加

---

[以降、既存の更新履歴が続きます...]

---

## 📄 ライセンス

このプロジェクトは私的利用を目的としています。

---

## 📞 お問い合わせ

システムに関する質問や問題は、Issuesでお知らせください。
