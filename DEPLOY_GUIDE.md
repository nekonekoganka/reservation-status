# Cloud Run 更新デプロイ手順

コードを更新した後、Cloud Runに反映させる手順です。
**コピペするだけでOK！**

---

## 事前準備

1. Google Cloud Console を開く: https://console.cloud.google.com/
2. 右上の `Cloud Shell を有効にする` ボタンをクリック
3. Cloud Shell が起動したら、以下のコマンドを順番に実行

---

## Step 1: プロジェクト設定

```bash
gcloud config set project forward-script-470815-c5
```

---

## Step 2: コードを取得

```bash
cd ~
rm -rf reservation-status
git clone https://github.com/nekonekoganka/reservation-status.git
cd reservation-status
```

---

## Step 3: 一般予約用をデプロイ

```bash
cd ~/reservation-status/docker-timeslot-checker

gcloud run deploy reservation-timeslot-checker \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 3 \
  --min-instances 0 \
  --set-env-vars BUCKET_NAME=reservation-timeslots-fujiminohikari
```

**所要時間**: 約5〜10分

途中で質問されたら `y` と入力してEnter

---

## Step 4: 視野予約用をデプロイ

```bash
cd ~/reservation-status/docker-timeslot-checker-shiya

gcloud run deploy reservation-timeslot-checker-shiya \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 3 \
  --min-instances 0 \
  --set-env-vars BUCKET_NAME=reservation-timeslots-fujiminohikari
```

**所要時間**: 約5〜10分

---

## 完了！

両方のデプロイが完了したら、履歴データに `slots` 配列が含まれるようになります。
ダッシュボードの「埋まり時刻追跡→点滅表示」機能が動作します。

---

## トラブルシューティング

### 「APIが有効になっていません」と言われたら

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### デプロイに失敗したら

再度同じコマンドを実行してください。一時的なエラーの場合は再実行で成功します。

---

**作成日**: 2025年12月25日
