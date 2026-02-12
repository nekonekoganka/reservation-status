# Cloud Run 認証追加 作業ガイド（Claude 引き継ぎ用）

> **注意**: このドキュメント内の `<YOUR_PROJECT_ID>`, `<YOUR_PROJECT_NUMBER>`, `<YOUR_CLOUD_RUN_URL>` は `.env` ファイルの実際の値に置き換えてください。

## 作業ステータス: 完了済み (2026-02-12)

全ステップを Cloud Shell にて実施済み。以下は記録と、今後の再設定・ロールバック用の手順書。

## 背景

リポジトリ `nekonekoganka/reservation-status` が公開設定になっている。
Cloud Run の URL がソースコード内にハードコードされており、認証なしで誰でもアクセスできてしまう。

**解決策**: Cloud Run を認証必須にし、Cloud Scheduler には OIDC トークン認証を追加する。

## 実施時の注意点（実績に基づく）

- `gcloud run services update --no-allow-unauthenticated` は Cloud Shell の gcloud バージョンによっては**非対応**
- 代わりに `gcloud run services remove-iam-policy-binding` で `allUsers` を削除する方式で同等の効果を得られる

---

## 基本情報

| 項目 | 値 |
|------|-----|
| GCP プロジェクトID | `<YOUR_PROJECT_ID>` |
| プロジェクト番号 | `<YOUR_PROJECT_NUMBER>` |
| リージョン | `asia-northeast1` |
| Cloud Run サービス名 | `reservation-timeslot-checker-unified` |
| Cloud Run URL | `<YOUR_CLOUD_RUN_URL>` |
| サービスアカウント | `<YOUR_PROJECT_NUMBER>-compute@developer.gserviceaccount.com` |

---

## やること（全体の流れ）

```
方法A: スクリプトで一括実行（推奨）
方法B: Cloud Shell で手動コマンド実行
方法C: Google Cloud Console の GUI で操作
```

---

## 方法A: スクリプトで一括実行（推奨・最速）

### 手順

1. Google Cloud Console を開く
2. 右上の `Cloud Shell を有効にする` アイコン（`>_`）をクリック
3. 以下のコマンドを順番に実行：

```bash
git clone https://github.com/nekonekoganka/reservation-status.git
cd reservation-status
bash secure-cloudrun.sh
```

4. スクリプトが自動で以下を全て実行する：
   - サービスアカウントに Cloud Run Invoker 権限を付与
   - Cloud Run を認証必須に変更
   - 全11個の Cloud Scheduler ジョブに OIDC 認証を追加
   - 動作確認テスト

5. 最後に「完了！」と表示されれば成功

### スクリプト実行後の確認ポイント

- `HTTP 403` が表示されること（認証なしアクセスが拒否された証拠）
- 11ジョブ全て「OK」になっていること

---

## 方法B: Cloud Shell で手動コマンド実行

スクリプトを使わず、1つずつコマンドを打つ場合。

### Step 1: プロジェクト設定

```bash
gcloud config set project <YOUR_PROJECT_ID>
```

### Step 2: サービスアカウントに権限付与

```bash
gcloud run services add-iam-policy-binding reservation-timeslot-checker-unified \
  --region=asia-northeast1 \
  --member="serviceAccount:<YOUR_PROJECT_NUMBER>-compute@developer.gserviceaccount.com" \
  --role="roles/run.invoker" \
  --quiet
```

### Step 3: Cloud Run を認証必須に変更

```bash
# 方法1: allUsers の権限を削除（Cloud Shell で確実に動く方式）
gcloud run services remove-iam-policy-binding reservation-timeslot-checker-unified \
  --region=asia-northeast1 \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --quiet

# 方法2: gcloud バージョンが対応していれば（非対応の場合はエラーになる）
# gcloud run services update reservation-timeslot-checker-unified \
#   --region=asia-northeast1 \
#   --no-allow-unauthenticated \
#   --quiet
```

### Step 4: Cloud Scheduler 全11ジョブに OIDC 認証追加

以下の11コマンドを全て実行する：

```bash
gcloud scheduler jobs update http timeslot-checker-unified-general-morning \
  --location=asia-northeast1 \
  --oidc-service-account-email=<YOUR_PROJECT_NUMBER>-compute@developer.gserviceaccount.com \
  --oidc-token-audience=<YOUR_CLOUD_RUN_URL> \
  --quiet

gcloud scheduler jobs update http timeslot-checker-unified-general-afternoon \
  --location=asia-northeast1 \
  --oidc-service-account-email=<YOUR_PROJECT_NUMBER>-compute@developer.gserviceaccount.com \
  --oidc-token-audience=<YOUR_CLOUD_RUN_URL> \
  --quiet

gcloud scheduler jobs update http timeslot-checker-unified-general-offpeak \
  --location=asia-northeast1 \
  --oidc-service-account-email=<YOUR_PROJECT_NUMBER>-compute@developer.gserviceaccount.com \
  --oidc-token-audience=<YOUR_CLOUD_RUN_URL> \
  --quiet

gcloud scheduler jobs update http timeslot-checker-unified-general-wed \
  --location=asia-northeast1 \
  --oidc-service-account-email=<YOUR_PROJECT_NUMBER>-compute@developer.gserviceaccount.com \
  --oidc-token-audience=<YOUR_CLOUD_RUN_URL> \
  --quiet

gcloud scheduler jobs update http timeslot-checker-unified-shiya-daytime \
  --location=asia-northeast1 \
  --oidc-service-account-email=<YOUR_PROJECT_NUMBER>-compute@developer.gserviceaccount.com \
  --oidc-token-audience=<YOUR_CLOUD_RUN_URL> \
  --quiet

gcloud scheduler jobs update http timeslot-checker-unified-shiya-offpeak \
  --location=asia-northeast1 \
  --oidc-service-account-email=<YOUR_PROJECT_NUMBER>-compute@developer.gserviceaccount.com \
  --oidc-token-audience=<YOUR_CLOUD_RUN_URL> \
  --quiet

gcloud scheduler jobs update http timeslot-checker-unified-shiya-wed \
  --location=asia-northeast1 \
  --oidc-service-account-email=<YOUR_PROJECT_NUMBER>-compute@developer.gserviceaccount.com \
  --oidc-token-audience=<YOUR_CLOUD_RUN_URL> \
  --quiet

gcloud scheduler jobs update http generate-daily-summary-general \
  --location=asia-northeast1 \
  --oidc-service-account-email=<YOUR_PROJECT_NUMBER>-compute@developer.gserviceaccount.com \
  --oidc-token-audience=<YOUR_CLOUD_RUN_URL> \
  --quiet

gcloud scheduler jobs update http generate-daily-summary-shiya \
  --location=asia-northeast1 \
  --oidc-service-account-email=<YOUR_PROJECT_NUMBER>-compute@developer.gserviceaccount.com \
  --oidc-token-audience=<YOUR_CLOUD_RUN_URL> \
  --quiet

gcloud scheduler jobs update http monthly-summary-unified \
  --location=asia-northeast1 \
  --oidc-service-account-email=<YOUR_PROJECT_NUMBER>-compute@developer.gserviceaccount.com \
  --oidc-token-audience=<YOUR_CLOUD_RUN_URL> \
  --quiet

gcloud scheduler jobs update http monthly-summary-unified-shiya \
  --location=asia-northeast1 \
  --oidc-service-account-email=<YOUR_PROJECT_NUMBER>-compute@developer.gserviceaccount.com \
  --oidc-token-audience=<YOUR_CLOUD_RUN_URL> \
  --quiet
```

### Step 5: 確認

```bash
# 認証なしアクセスが拒否されることを確認（403が返ればOK）
curl -s -o /dev/null -w "%{http_code}" <YOUR_CLOUD_RUN_URL>/

# Scheduler ジョブの一覧を確認
gcloud scheduler jobs list --location=asia-northeast1

# 手動でジョブを1つ実行して動作確認
gcloud scheduler jobs run timeslot-checker-unified-general-morning --location=asia-northeast1

# Cloud Run のログで成功を確認
gcloud run services logs read reservation-timeslot-checker-unified --region=asia-northeast1 --limit=5
```

---

## 方法C: Google Cloud Console GUI での操作

### C-1: Cloud Run の認証設定

1. Cloud Run → サービス → `reservation-timeslot-checker-unified` を開く
2. 「セキュリティ」タブ（または「トリガー」タブ）
3. 「認証」セクション → **「認証が必要」** を選択
4. 保存

### C-2: Cloud Scheduler の OIDC 設定（11ジョブそれぞれ）

1. Cloud Scheduler → ジョブ一覧
2. 各ジョブをクリック → 「編集」
3. 「Auth ヘッダーを表示」または「認証ヘッダー」セクションを展開
4. 以下を設定：
   - **認証ヘッダー**: `OIDC トークンを追加`
   - **サービスアカウント**: `<YOUR_PROJECT_NUMBER>-compute@developer.gserviceaccount.com`
   - **対象**: `<YOUR_CLOUD_RUN_URL>`
5. 「更新」をクリック
6. **11ジョブ全てに同じ設定を繰り返す**

対象ジョブ一覧:
1. `timeslot-checker-unified-general-morning`
2. `timeslot-checker-unified-general-afternoon`
3. `timeslot-checker-unified-general-offpeak`
4. `timeslot-checker-unified-general-wed`
5. `timeslot-checker-unified-shiya-daytime`
6. `timeslot-checker-unified-shiya-offpeak`
7. `timeslot-checker-unified-shiya-wed`
8. `generate-daily-summary-general`
9. `generate-daily-summary-shiya`
10. `monthly-summary-unified`
11. `monthly-summary-unified-shiya`

### C-3: サービスアカウントに権限付与（GUIの場合）

1. Cloud Run → `reservation-timeslot-checker-unified` → 「権限」タブ
2. 「プリンシパルを追加」
3. **新しいプリンシパル**: `<YOUR_PROJECT_NUMBER>-compute@developer.gserviceaccount.com`
4. **ロール**: `Cloud Run 起動元`（Cloud Run Invoker）
5. 「保存」

---

## 完了後の確認チェックリスト

- [ ] ブラウザで `<YOUR_CLOUD_RUN_URL>/` にアクセス → **403 Forbidden** が返る
- [ ] Cloud Scheduler のジョブを1つ手動実行 → 成功する
- [ ] `https://storage.googleapis.com/reservation-timeslots-fujiminohikari/timeslots.json` がまだ更新されている
- [ ] ダッシュボード `https://nekonekoganka.github.io/reservation-status/dashboard.html` が正常に動作

---

## 万が一問題が起きた場合のロールバック

```bash
gcloud run services add-iam-policy-binding reservation-timeslot-checker-unified \
  --region=asia-northeast1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

この1コマンドで元の「認証なし」状態に即座に戻せる。
ダッシュボードや HTML ページには一切影響がないので、安心してロールバックできる。

---

## よくある質問

**Q: HTML ページやダッシュボードは影響を受ける？**
A: 受けない。これらは Cloud Storage（`storage.googleapis.com`）からデータを取得しており、Cloud Run には直接アクセスしない。

**Q: Android アプリや Chrome 拡張は？**
A: 同様に影響なし。Cloud Storage 経由で JSON データを取得している。

**Q: サービスアカウントのメールアドレスが違う場合は？**
A: Cloud Shell で以下を実行して確認：
```bash
gcloud iam service-accounts list
```

**Q: ジョブが FAILED になった場合は？**
A: Cloud Run のログを確認：
```bash
gcloud run services logs read reservation-timeslot-checker-unified --region=asia-northeast1 --limit=20
```
