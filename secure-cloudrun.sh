#!/bin/bash
# =============================================================================
# Cloud Run 認証追加スクリプト
#
# Cloud Run の /check 等のエンドポイントを認証必須に変更し、
# Cloud Scheduler からのリクエストのみ許可する。
#
# 使い方:
#   1. Google Cloud Console → Cloud Shell を開く
#   2. このスクリプトを実行:
#      bash secure-cloudrun.sh
#
# 影響範囲:
#   - Cloud Run: 認証なしアクセスを拒否（403 Forbidden）
#   - Cloud Scheduler: OIDC トークン認証を追加（自動で認証される）
#   - HTML/Android/Chrome拡張: 影響なし（Cloud Storage 経由のため）
#
# 作成日: 2026-02-11
# =============================================================================

set -e

# --- 設定 ---
PROJECT_ID="forward-script-470815-c5"
REGION="asia-northeast1"
SERVICE_NAME="reservation-timeslot-checker-unified"
CLOUD_RUN_URL="https://reservation-timeslot-checker-unified-224924651996.asia-northeast1.run.app"

# Cloud Scheduler ジョブ名一覧（全11ジョブ）
SCHEDULER_JOBS=(
  "timeslot-checker-unified-general-morning"
  "timeslot-checker-unified-general-afternoon"
  "timeslot-checker-unified-general-offpeak"
  "timeslot-checker-unified-general-wed"
  "timeslot-checker-unified-shiya-daytime"
  "timeslot-checker-unified-shiya-offpeak"
  "timeslot-checker-unified-shiya-wed"
  "generate-daily-summary-general"
  "generate-daily-summary-shiya"
  "monthly-summary-unified"
  "monthly-summary-unified-shiya"
)

# 色付き出力
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "=============================================="
echo " Cloud Run 認証追加スクリプト"
echo "=============================================="
echo ""

# --- Step 0: プロジェクト設定 ---
echo -e "${YELLOW}[Step 0] プロジェクトを設定中...${NC}"
gcloud config set project "$PROJECT_ID"
echo -e "${GREEN}  → プロジェクト: ${PROJECT_ID}${NC}"
echo ""

# --- Step 1: サービスアカウントを取得 ---
echo -e "${YELLOW}[Step 1] サービスアカウントを取得中...${NC}"

# デフォルトの Compute Engine サービスアカウントを取得
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo -e "${GREEN}  → サービスアカウント: ${SERVICE_ACCOUNT}${NC}"
echo ""

# --- Step 2: サービスアカウントに Cloud Run 起動権限を付与 ---
echo -e "${YELLOW}[Step 2] サービスアカウントに Cloud Run Invoker 権限を付与中...${NC}"

gcloud run services add-iam-policy-binding "$SERVICE_NAME" \
  --region="$REGION" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/run.invoker" \
  --quiet

echo -e "${GREEN}  → 権限付与完了${NC}"
echo ""

# --- Step 3: Cloud Run を認証必須に変更 ---
# 注: --no-allow-unauthenticated は Cloud Shell の gcloud バージョンによっては
#     非対応のため、allUsers の run.invoker 権限を削除する方式を使用する。
echo -e "${YELLOW}[Step 3] Cloud Run を認証必須に変更中（allUsers 権限を削除）...${NC}"

if gcloud run services remove-iam-policy-binding "$SERVICE_NAME" \
  --region="$REGION" \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --quiet 2>/dev/null; then
  echo -e "${GREEN}  → 認証必須に変更完了（allUsers を削除）${NC}"
else
  echo -e "${YELLOW}  → allUsers バインディングが既に存在しません（認証必須済み）${NC}"
fi
echo ""

# --- Step 4: 全 Cloud Scheduler ジョブに OIDC 認証を追加 ---
echo -e "${YELLOW}[Step 4] Cloud Scheduler ジョブに OIDC 認証を追加中...${NC}"
echo "  対象ジョブ数: ${#SCHEDULER_JOBS[@]}"
echo ""

SUCCESS_COUNT=0
FAIL_COUNT=0

for JOB_NAME in "${SCHEDULER_JOBS[@]}"; do
  echo -n "  ${JOB_NAME} ... "

  if gcloud scheduler jobs update http "$JOB_NAME" \
    --location="$REGION" \
    --oidc-service-account-email="$SERVICE_ACCOUNT" \
    --oidc-token-audience="$CLOUD_RUN_URL" \
    --quiet 2>/dev/null; then
    echo -e "${GREEN}OK${NC}"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo -e "${RED}FAILED${NC}"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
done

echo ""
echo -e "  結果: ${GREEN}成功 ${SUCCESS_COUNT}件${NC} / ${RED}失敗 ${FAIL_COUNT}件${NC}"
echo ""

# --- Step 5: 設定確認 ---
echo -e "${YELLOW}[Step 5] 設定を確認中...${NC}"
echo ""

echo "  Cloud Run 認証設定:"
INGRESS=$(gcloud run services describe "$SERVICE_NAME" \
  --region="$REGION" \
  --format='value(metadata.annotations["run.googleapis.com/ingress"])' 2>/dev/null || echo "不明")
echo -e "  → Ingress: ${INGRESS}"

echo ""
echo "  Cloud Scheduler ジョブ一覧:"
gcloud scheduler jobs list --location="$REGION" \
  --format="table(name.basename(), schedule, state)" 2>/dev/null || echo "  → 一覧取得に失敗"

echo ""

# --- Step 6: 動作テスト ---
echo -e "${YELLOW}[Step 6] 動作テスト...${NC}"
echo ""

echo "  1. 認証なしアクセスが拒否されることを確認:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${CLOUD_RUN_URL}/")
if [ "$HTTP_CODE" = "403" ]; then
  echo -e "     → ${GREEN}HTTP ${HTTP_CODE} (正常: 認証なしアクセスが拒否されました)${NC}"
else
  echo -e "     → ${YELLOW}HTTP ${HTTP_CODE} (期待値: 403)${NC}"
fi

echo ""
echo "  2. Cloud Scheduler からの認証付きアクセスをテスト:"
echo "     以下のコマンドで手動実行して確認してください:"
echo ""
echo "     gcloud scheduler jobs run timeslot-checker-unified-general-morning --location=${REGION}"
echo ""
echo "     実行後、Cloud Run のログで成功を確認:"
echo "     gcloud run services logs read ${SERVICE_NAME} --region=${REGION} --limit=5"

echo ""
echo "=============================================="
echo -e "${GREEN} 完了！${NC}"
echo "=============================================="
echo ""
echo "変更内容:"
echo "  - Cloud Run: 認証なしアクセスを拒否"
echo "  - Cloud Scheduler: OIDC トークン認証を使用"
echo ""
echo "影響なし:"
echo "  - HTML ページ（バナー、ダッシュボード等）"
echo "  - Android アプリ"
echo "  - Chrome 拡張機能"
echo "  - Cloud Storage の公開 URL"
echo ""
echo "ロールバックする場合:"
echo "  gcloud run services add-iam-policy-binding ${SERVICE_NAME} \\"
echo "    --region=${REGION} --member=allUsers --role=roles/run.invoker"
echo ""
