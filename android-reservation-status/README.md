# 予約状況ステータスバー表示アプリ（Android）

Androidのステータスバー（画面上部の時計や電波アイコンがある場所）に、予約の空き状況を表示するアプリです。

## 完成イメージ

```
┌────────────────────────────────────────┐
│ 🔋 📶  [5] [3]  12:34                 │  ← ステータスバー
└────────────────────────────────────────┘
          ↑   ↑
        一般  視野
       (白黒アイコンで数字表示)
```

- 数字 = 空き枠数
- ✕ = 満枠
- ? = 取得エラー

---

## 開発環境のセットアップ（初心者向け）

### 1. Android Studioのインストール

1. [Android Studio公式サイト](https://developer.android.com/studio) にアクセス
2. 「Download Android Studio」をクリック
3. ダウンロードしたファイルを実行してインストール
4. 初回起動時に「Standard」を選択してセットアップを完了

### 2. プロジェクトを開く

1. Android Studioを起動
2. 「Open」をクリック
3. このフォルダ（`android-reservation-status`）を選択
4. 「OK」をクリック
5. Gradleの同期が完了するまで待つ（数分かかることがあります）

---

## ビルド方法

### 方法1: Android Studioでビルド

1. Android Studioでプロジェクトを開く
2. 右上の「▶️」（Run）ボタンをクリック
3. 接続したAndroid端末またはエミュレータを選択
4. アプリがインストールされて起動

### 方法2: コマンドラインでビルド

```bash
# プロジェクトフォルダに移動
cd android-reservation-status

# デバッグ版APKをビルド
./gradlew assembleDebug

# APKファイルの場所
# app/build/outputs/apk/debug/app-debug.apk
```

---

## APKのインストール方法

### 方法1: USB接続でインストール

1. Android端末の「設定」→「開発者オプション」→「USBデバッグ」を有効化
2. PCとAndroid端末をUSBケーブルで接続
3. Android Studioで「▶️」ボタンをクリック

### 方法2: APKファイルを直接インストール

1. APKファイル（`app-debug.apk`）をAndroid端末に転送
2. 端末の「設定」→「セキュリティ」→「提供元不明のアプリ」を許可
3. ファイルマネージャーでAPKファイルをタップしてインストール

---

## アプリの使い方

### 初回起動時

1. アプリを起動
2. 「通知の許可」を求められたら「許可」をタップ
3. 「開始」ボタンをタップ
4. ステータスバーに予約状況が表示される

### 通知の確認

- ステータスバーを下にスワイプすると、詳細な通知が表示されます
- 「一般予約」と「視野予約」の2つの通知があります

### 停止方法

1. アプリを起動
2. 「停止」ボタンをタップ

---

## ファイル構成

```
android-reservation-status/
├── app/
│   ├── src/main/
│   │   ├── java/com/fujiminohikari/reservationstatus/
│   │   │   ├── MainActivity.kt        # メイン画面
│   │   │   ├── ReservationService.kt  # 常駐サービス
│   │   │   ├── DataFetcher.kt         # データ取得
│   │   │   └── BootReceiver.kt        # 起動時の自動開始
│   │   ├── res/
│   │   │   ├── layout/
│   │   │   │   └── activity_main.xml  # 画面レイアウト
│   │   │   ├── drawable/              # アイコン
│   │   │   └── values/                # 文字列・テーマ
│   │   └── AndroidManifest.xml        # アプリ設定
│   └── build.gradle.kts               # アプリのビルド設定
├── build.gradle.kts                   # プロジェクト設定
├── settings.gradle.kts                # Gradle設定
└── README.md                          # このファイル
```

---

## 各ファイルの説明

### MainActivity.kt
メイン画面のコード。サービスの開始/停止ボタンと、現在のステータス表示を担当。

### ReservationService.kt
バックグラウンドで動作する常駐サービス。1分ごとにデータを取得し、ステータスバーの通知を更新。

### DataFetcher.kt
Cloud StorageからJSONデータを取得するクラス。一般予約と視野予約の両方に対応。

### BootReceiver.kt
端末起動時にサービスを自動的に開始するためのレシーバー。

---

## カスタマイズ

### データ取得URLの変更

`DataFetcher.kt` の以下の部分を変更:

```kotlin
private const val GENERAL_URL = "https://storage.googleapis.com/..."
private const val SHIYA_URL = "https://storage.googleapis.com/..."
```

### 更新間隔の変更

`ReservationService.kt` の以下の部分を変更:

```kotlin
const val UPDATE_INTERVAL = 60000L // 1分（ミリ秒）
```

### アイコンの色

`ReservationService.kt` の `createNotification` メソッドで色を指定。

---

## トラブルシューティング

### ビルドエラーが出る場合

1. Android Studioで「File」→「Sync Project with Gradle Files」を実行
2. 「Build」→「Clean Project」を実行してから再ビルド

### 通知が表示されない場合

1. 端末の「設定」→「アプリ」→「予約状況」→「通知」を確認
2. 「すべての通知」が有効になっているか確認

### データが取得できない場合

1. インターネット接続を確認
2. Cloud StorageのURLが正しいか確認

---

## 必要な権限

| 権限 | 用途 |
|------|------|
| INTERNET | データ取得 |
| FOREGROUND_SERVICE | 常駐サービス |
| POST_NOTIFICATIONS | 通知表示（Android 13以降） |
| RECEIVE_BOOT_COMPLETED | 端末起動時の自動開始 |

---

## 技術仕様

- **最小Android版**: 8.0 (API 26)
- **対象Android版**: 14 (API 34)
- **言語**: Kotlin
- **ネットワーク**: OkHttp
- **非同期処理**: Coroutines

---

## リリース版のビルド（Google Play公開用）

```bash
# リリース版APKをビルド
./gradlew assembleRelease
```

※ リリース版には署名が必要です。詳細は[公式ドキュメント](https://developer.android.com/studio/publish/app-signing)を参照。

---

## ライセンス

このプロジェクトは内部利用目的で作成されています。
