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

### 🚪 エントランスディスプレイ

- **[エントランスディスプレイ](https://nekonekoganka.github.io/reservation-status/entrance-display.html)**
  - クリニック入口のディスプレイ用
  - 一般予約と視野予約を横並びで表示
- **[エントランスディスプレイ（デバッグ）](https://nekonekoganka.github.io/reservation-status/entrance-display-debug.html)**
  - カスタマイズ機能付きのデバッグ版

### 📊 ダッシュボード

- **[予約傾向ダッシュボード](https://nekonekoganka.github.io/reservation-status/dashboard.html)**
  - 予約データの傾向分析・可視化
  - 曜日別・時間帯別の予約傾向をグラフ表示
  - 詳細：[DASHBOARD-README.md](DASHBOARD-README.md)

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
├── entrance-display.html           # エントランスディスプレイ（入口用）
├── entrance-display-debug.html     # エントランスディスプレイ（デバッグ版）
├── dashboard.html                  # 予約傾向ダッシュボード（分析・可視化）
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
- **費用:** 月額 約1,700〜2,100円（最適化設定適用後）
- **Google Cloudプロジェクト:**
  - プロジェクト番号: 224924651996
  - プロジェクト ID: forward-script-470815-c5
- 詳細：[docker-timeslot-checker/README.md](docker-timeslot-checker/README.md)
- **コスト最適化手順:** [COST_OPTIMIZATION_GUIDE.md](COST_OPTIMIZATION_GUIDE.md)

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

### Cloud Run サービス

| 種類 | サービス名 | URL |
|---|---|---|
| 一般予約 | `timeslot-checker` | `https://timeslot-checker-224924651996.asia-northeast1.run.app` |
| 視野予約 | `timeslot-checker-shiya` | `https://timeslot-checker-shiya-224924651996.asia-northeast1.run.app` |

### Cloud Scheduler ジョブ（最適化設定・実施済み）

| 種類 | ジョブ名 | スケジュール | 説明 |
|---|---|---|---|
| 一般予約（ピーク） | `reservation-timeslot-checker-job-peak` | `*/1 7-17 * * *` | 7:00-17:59、1分毎 |
| 一般予約（オフピーク） | `reservation-timeslot-checker-job-offpeak` | `*/5 0-6,18-23 * * *` | 18:00-6:59、5分毎 |
| 視野予約（ピーク） | `reservation-timeslot-checker-shiya-job-peak` | `*/1 7-17 * * *` | 7:00-17:59、1分毎 |
| 視野予約（オフピーク） | `reservation-timeslot-checker-shiya-job-offpeak` | `*/5 0-6,18-23 * * *` | 18:00-6:59、5分毎 |
| 月次集計（一般） | `monthly-summary-general` | `0 1 1 * *` | 毎月1日1:00 |
| 月次集計（視野） | `monthly-summary-shiya` | `0 1 1 * *` | 毎月1日1:00 |

**実施日:** 2026年1月10日

**コスト最適化の詳細:** [COST_OPTIMIZATION_GUIDE.md](COST_OPTIMIZATION_GUIDE.md)

**注意:** Schedulerのジョブ名とCloud Runのサービス名が異なるため、デプロイ後はSchedulerの向き先URLも確認が必要です。

### デプロイ手順

```bash
# 一般予約
cd docker-timeslot-checker
gcloud run deploy timeslot-checker \
  --source . \
  --region asia-northeast1 \
  --memory 1Gi

# 視野予約
cd docker-timeslot-checker-shiya
gcloud run deploy timeslot-checker-shiya \
  --source . \
  --region asia-northeast1 \
  --memory 1Gi
```

**デプロイ後の確認:**
```bash
# 履歴ファイルが作成されているか確認
gsutil ls gs://reservation-timeslots-fujiminohikari/history/general/
gsutil ls gs://reservation-timeslots-fujiminohikari/history/shiya/
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

### 2026年1月10日 - Cloud Scheduler設定変更実施 🆕

#### ✅ コスト最適化の本番適用

**実施日時:** 2026年1月10日

**実施内容:**
Cloud Schedulerの実行頻度を時間帯別に最適化し、月額費用を削減しました。

**変更詳細:**

| 項目 | 変更前 | 変更後 |
|-----|-------|-------|
| 診療時間帯（7:00〜17:59） | 1分間隔 | 1分間隔（維持） |
| 診療時間外（18:00〜6:59） | 1分間隔 | 5分間隔 |

**作成したジョブ（4つ）:**
- `reservation-timeslot-checker-job-peak`（一般予約・1分毎・7-17時）
- `reservation-timeslot-checker-job-offpeak`（一般予約・5分毎・18-6時）
- `reservation-timeslot-checker-shiya-job-peak`（視野予約・1分毎・7-17時）
- `reservation-timeslot-checker-shiya-job-offpeak`（視野予約・5分毎・18-6時）

**削除したジョブ（2つ）:**
- `reservation-timeslot-checker-job`
- `reservation-timeslot-checker-shiya-job`

**期待される効果:**
- 実行回数: 2,880回/日 → 1,632回/日（43%削減）
- 月額費用: 約¥4,500〜5,400 → 約¥2,500〜3,000（約¥2,000削減）

**動作確認:**
- ジョブの手動実行テスト: ✅ 完了
- 全8ジョブのSTATE: ENABLED確認済み

**備考:**
問題発生時は [COST_OPTIMIZATION_GUIDE.md](COST_OPTIMIZATION_GUIDE.md) の「元に戻す場合」セクションを参照して復旧可能。

---

### 2026年1月9日 - Cloud Runコスト最適化

#### 💰 実行頻度の時間帯別最適化

**概要:**
Cloud Runの実行頻度を時間帯・サービス別に最適化し、月額費用を大幅に削減しました。

**変更内容:**

| サービス | 時間帯 | 変更前 | 変更後 |
|---------|-------|-------|-------|
| 一般予約 | 7:00〜17:59 | 1分間隔 | 1分間隔（維持） |
| 一般予約 | 18:00〜翌6:59 | 1分間隔 | **5分間隔** |
| 視野予約 | 7:00〜17:59 | 1分間隔 | **3分間隔** |
| 視野予約 | 18:00〜翌6:59 | 1分間隔 | **10分間隔** |

**効果:**

| 項目 | 変更前 | 変更後 |
|-----|-------|-------|
| 実行回数/日 | 2,880回 | 1,114回（61%削減） |
| 月額費用 | ¥4,500〜5,400 | **¥1,700〜2,100** |
| 年間削減額 | - | **約¥34,000** |

**背景:**
- HPや玄関の電光掲示板への表示用途では、診療時間外の即時性は不要
- 一般予約は患者が頻繁にチェックするため1分間隔を維持
- 視野予約は即時性が低いため3分間隔に変更

**設定手順:** [COST_OPTIMIZATION_GUIDE.md](COST_OPTIMIZATION_GUIDE.md)

**変更ファイル:**
- `COST_OPTIMIZATION_GUIDE.md` - 新規作成（設定変更手順書）
- `docker-timeslot-checker/README.md` - 料金目安を更新
- `README.md` - Cloud Scheduler設定を更新

---

### 2026年1月2日 - ダッシュボード大幅改善とスマホ版最適化

#### 📊 時間枠別埋まり推移ヒートマップの実装

**概要:**
各予約枠がいつ埋まったかを視覚的に確認できるヒートマップを実装しました。当初は3Dグラフ（Plotly.js）で実装しましたが、見やすさを優先して2Dヒートマップに変更しました。

**ヒートマップの仕様:**
```
       10:00  10:15  10:30  ...  17:45
19:00  □     □     □           □      ← 前日19時時点
21:00  □     □     □           □
...
09:00  ■     □     ■           □
11:00  ■     ■     ■           ■      ← 当日11時時点
  ↓時刻の経過（2時間刻み）
```

- **横軸**: 予約枠の時間帯（10:00〜18:00）
- **縦軸**: 時刻の経過（2時間刻み: 19:00, 21:00, 23:00, 01:00, 03:00, 05:00, 07:00, 09:00, 11:00, 13:00, 15:00, 17:00）
- **白色**: 空き
- **色付き**: 埋まり（一般=オレンジ #CC6600、視野=緑 #006633）

**実装のポイント:**
```javascript
// 2時間刻みのターゲット時刻
const targetHours = ['19:00', '21:00', '23:00', '01:00', '03:00', '05:00',
                     '07:00', '09:00', '11:00', '13:00', '15:00', '17:00'];

// 各ターゲット時刻に最も近いエントリを取得
targetHours.forEach(targetTime => {
    // 日をまたぐ場合の調整（18:30開始なので19時以降は同日扱い）
    if (entryMinutes < 18 * 60) entryMinutes += 24 * 60;
    if (targetMinutes < 18 * 60) targetMinutes += 24 * 60;
});
```

**変更履歴:**
1. 3Dサーフェスチャート（Plotly.js）で実装
2. 見づらいとのフィードバックで2Dヒートマップに変更
3. 縦軸を1分刻みから2時間刻みに変更
4. 横幅いっぱいに表示するようレイアウト変更

---

#### 🎨 タイムラインバーの2時間以内色変わり機能

**概要:**
タイムラインバーで、2時間以内に状態が変わった枠にアニメーションを適用する機能を実装しました。

**機能:**
- **2時間以内に埋まった枠**: パルスアニメーション（点滅）
  - 一般予約: 赤色 (#EE3333) で点滅
  - 視野予約: 黄緑色 (#88CC00) で点滅
- **2時間以内にキャンセル発生**: グローアニメーション（発光）
  - 一般予約: オレンジのグロー
  - 視野予約: 緑のグロー

**CSSアニメーション:**
```css
/* 2時間以内に埋まった枠のパルス */
@keyframes pulse-general {
    0%, 100% { background: #EE3333; }
    50% { background: #FF6666; }
}

/* キャンセル発生時のグロー */
@keyframes glow-general {
    0%, 100% { box-shadow: 0 0 5px 2px rgba(204, 102, 0, 0.6); }
    50% { box-shadow: 0 0 12px 4px rgba(204, 102, 0, 0.9); }
}
```

**バグ修正:**
スマホ版で2時間以内色変わり機能が動作していなかった問題を修正。
- **原因**: 存在しない `renderTimeline()` 関数を呼んでいた
- **修正**: 正しい `renderDotTimeline()` 関数を呼ぶよう変更

```javascript
// 修正前（バグ）
renderTimeline('general', generalData.slots || []);

// 修正後
renderDotTimeline('general', 'Am', AM_SLOTS, generalData.slots || []);
renderDotTimeline('general', 'Pm', PM_SLOTS, generalData.slots || []);
```

---

#### 📱 スマホ版レイアウトの最適化

**概要:**
スマホ版ダッシュボードの表示順序を最適化し、重要な情報を優先表示するようにしました。

**表示順序（CSS flexbox order使用）:**
```css
.container > header { order: 1; }
.container > .current-status-section { order: 2; }  /* 現在の空き状況 */
.container > .weekly-progress-chart { order: 3; }   /* 直近1週間の推移 */
.container > #slotFillProgressSection { order: 4; } /* 時間枠別埋まり推移 */
.container > .controls { order: 5; }                /* コントロール */
.container > .daily-progress-chart { order: 6; }    /* 曜日別平均 */
```

**改善点:**
- 現在の空き状況を最優先で表示
- 時間枠別埋まり推移ヒートマップをスマホでも表示可能に
- PC版とスマホ版で異なるレイアウト順序を実現

---

#### ⚡ スマホ版読み込み速度の改善

**問題:**
スマホでダッシュボードを開いた際、折れ線グラフが表示されなかったり、古いキャッシュデータが表示されることがあった。

**原因:**
複数のAPIリクエストが同時に発生し、帯域幅を奪い合っていた。

**修正内容:**
```javascript
async function loadCurrentStatus() {
    // === STEP 1: 現在の空き枠を最優先で取得・表示 ===
    const [generalData, shiyaData] = await Promise.all([...]);

    // まずアニメーションなしで即座に表示
    updateCurrentStatusCard('general', generalData);
    updateCurrentStatusCard('shiya', shiyaData);

    // === STEP 2: 履歴データを非同期で取得（待たない） ===
    Promise.all([fetchTodayHistory('general'), fetchTodayHistory('shiya')])
        .then(([generalHistory, shiyaHistory]) => {
            // 履歴取得後にアニメーションを適用
            analyzeSlotFillTimes(generalHistory, 'general');
            renderDotTimeline('general', 'Am', AM_SLOTS, generalData.slots);
        });
}
```

**効果:**
- 現在の空き状況が即座に表示される
- 履歴データ取得を待たずにUIが描画される
- ローディングスピナーでチャート読み込み中を明示

---

#### 🏷️ PC版凡例の日本語表記改善

**概要:**
PC版のタイムライン凡例をより分かりやすい表記に変更しました。

**変更内容:**
| 変更前 | 変更後 |
|---|---|
| 空き | 予約可能 |
| 2h以内埋 | 最近埋まった（2h以内） |
| 以前埋 | 以前から満枠 |
| 2h以内空 | キャンセル発生（2h以内） |

---

#### 🔌 Chrome拡張機能のアニメーション対応

**概要:**
Chrome拡張機能（一般予約・視野予約）のポップアップにもダッシュボードと同じアニメーション機能を実装しました。

**実装内容:**
- 履歴データを非同期で取得（UIのブロックを回避）
- 2時間以内に埋まった枠にパルスアニメーション
- キャンセル発生枠にグローアニメーション

**ローディング遅延の修正:**
```javascript
// 修正前（1秒の遅延が発生）
await fetchTodayHistory();
renderTimeline();

// 修正後（即座に表示、アニメーションは後から適用）
renderTimeline();  // まず表示
fetchTodayHistory().then(() => {
    analyzeSlotFillTimes(history);
    renderTimeline();  // アニメーション付きで再描画
});
```

---

#### 📁 変更ファイル

| ファイル | 変更内容 |
|---|---|
| `dashboard.html` | ヒートマップ実装、レイアウト順序変更、凡例改善、バグ修正 |
| `chrome-extension-timeslot-general/popup.html` | アニメーションCSS追加 |
| `chrome-extension-timeslot-general/popup.js` | 履歴取得・アニメーション適用ロジック |
| `chrome-extension-timeslot-shiya/popup.html` | アニメーションCSS追加 |
| `chrome-extension-timeslot-shiya/popup.js` | 履歴取得・アニメーション適用ロジック |

---

#### ⚠️ 実装時の注意点

**1. 日をまたぐ時刻計算**
```javascript
// 18:30開始のデータなので、19時以降は同日、18時未満は翌日扱い
if (entryMinutes < 18 * 60) entryMinutes += 24 * 60;
```

**2. スロット名のマッピング**
```javascript
// 13:00 → 12:55, 18:00 → 17:55 の変換が必要
if (slot === '13:00') return '12:55';
if (slot === '18:00') return '17:55';
```

**3. 履歴データの非同期取得**
履歴データ取得をawaitすると、UIの表示が遅延する。Promise.then()で非同期処理し、まずUIを表示してからアニメーションを適用する。

**4. CSS flexbox orderの優先順位**
より具体的なセレクタ（IDセレクタ）を後に記述することで、クラスセレクタよりも優先される。
```css
.container > .chart-card { order: 9; }           /* 一般的なカード */
.container > #slotFillProgressSection { order: 4; }  /* 特定のセクション */
```

---

### 2025年12月8日 - Cloud Run再デプロイと履歴保存機能の有効化

#### 🔧 Cloud Storage URL修正

**概要:**
`entrance-display.html` と `dashboard.html` のCloud Storage URLが古いバケット名を参照していた問題を修正しました。

**修正内容:**
| ファイル | 修正前 | 修正後 |
|---|---|---|
| entrance-display.html | `fujimino-ophthalmology-reservations` | `reservation-timeslots-fujiminohikari` |
| dashboard.html | `fujimino-ophthalmology-reservations` | `reservation-timeslots-fujiminohikari` |

#### 🚀 Cloud Run再デプロイ

**概要:**
履歴保存機能を有効化するため、Cloud Runサービスを再デプロイしました。

**デプロイしたサービス:**
- `timeslot-checker` (一般予約) - リビジョン: timeslot-checker-00007-qmf
- `timeslot-checker-shiya` (視野予約) - リビジョン: timeslot-checker-shiya-00001-vrk

#### ⚠️ Cloud Scheduler向き先修正

**問題:**
Cloud Schedulerが古いサービス名を呼び出していたため、履歴データが保存されていませんでした。

| 種類 | Schedulerが呼んでいたサービス | 実際のサービス名 |
|---|---|---|
| 一般予約 | `reservation-timeslot-checker` | `timeslot-checker` |
| 視野予約 | `reservation-timeslot-checker-shiya` | `timeslot-checker-shiya` |

**修正後のScheduler設定:**
```bash
# 一般予約
gcloud scheduler jobs update http reservation-timeslot-checker-job \
  --location=asia-northeast1 \
  --uri="https://timeslot-checker-224924651996.asia-northeast1.run.app/check"

# 視野予約
gcloud scheduler jobs update http reservation-timeslot-checker-shiya-job \
  --location=asia-northeast1 \
  --uri="https://timeslot-checker-shiya-224924651996.asia-northeast1.run.app/check"
```

#### 📊 履歴保存機能の有効化

**概要:**
ダッシュボード用の履歴データ保存が開始されました。

**保存先:**
```
gs://reservation-timeslots-fujiminohikari/
├── history/
│   ├── general/2025-12-08.json  ✅ 作成確認済み
│   └── shiya/2025-12-08.json    ✅ 作成確認済み
```

**効果:**
- 予約傾向ダッシュボードにデータが蓄積される
- 曜日別・時間帯別の分析が可能に

---

### 2025年12月7日 - タイムラインバー2本構成と白抜きドット

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
