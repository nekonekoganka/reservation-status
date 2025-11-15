// ポップアップのロジック

let countdownInterval = null;

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
  await loadStatus();
  startCountdown();

  // 更新ボタン
  document.getElementById('refresh-btn').addEventListener('click', async () => {
    const btn = document.getElementById('refresh-btn');
    btn.disabled = true;
    btn.innerHTML = '更新中<span class="loading"></span>';

    // バックグラウンドに更新を要求
    chrome.runtime.sendMessage({ action: 'updateNow' }, () => {
      setTimeout(async () => {
        await loadStatus();
        btn.disabled = false;
        btn.innerHTML = '🔄 今すぐ更新';
      }, 1000);
    });
  });

  // ストレージの変更を監視
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      loadStatus();
    }
  });
});

// ステータスを読み込んで表示
async function loadStatus() {
  try {
    const data = await chrome.storage.local.get([
      'lastUpdate',
      'status',
      'isAvailable',
      'timestamp',
      'error'
    ]);

    // エラーチェック
    const hasError = data.error || !data.lastUpdate;

    // ステータスインジケーター
    const indicator = document.getElementById('status-indicator');
    if (hasError) {
      indicator.className = 'status-indicator error';
      indicator.innerHTML = '<span>!</span><span>エラー発生</span>';
    } else {
      indicator.className = 'status-indicator ok';
      indicator.innerHTML = '<span>✓</span><span>正常動作中</span>';
    }

    // ステータステキスト
    const statusText = document.getElementById('status-text');
    if (hasError) {
      statusText.textContent = 'データ取得エラー';
      statusText.className = 'status-text error';
    } else if (data.isAvailable !== undefined) {
      statusText.textContent = data.isAvailable ? '◯ 空きあり' : '✕ 満枠';
      statusText.className = data.isAvailable ? 'status-text available' : 'status-text full';
    } else {
      statusText.textContent = '読み込み中...';
      statusText.className = 'status-text';
    }

    // アイコンを描画
    drawIcon(data.isAvailable !== undefined ? data.isAvailable : null);

    // 最終更新時刻
    if (data.lastUpdate) {
      const lastUpdate = new Date(data.lastUpdate);
      const timeStr = lastUpdate.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      document.getElementById('last-update').textContent = timeStr;
    } else {
      document.getElementById('last-update').textContent = '--:--';
    }

  } catch (error) {
    console.error('[視野予約] ステータス読み込みエラー:', error);
  }
}

// 次回更新までのカウントダウン
function startCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);
}

async function updateCountdown() {
  try {
    const data = await chrome.storage.local.get(['lastUpdate']);

    if (!data.lastUpdate) {
      document.getElementById('next-update').textContent = '--秒後';
      return;
    }

    const lastUpdate = new Date(data.lastUpdate);
    const nextUpdate = new Date(lastUpdate.getTime() + 60000); // 1分後
    const now = new Date();
    const diff = nextUpdate - now;

    if (diff <= 0) {
      document.getElementById('next-update').textContent = 'まもなく';
    } else {
      const seconds = Math.floor(diff / 1000);
      document.getElementById('next-update').textContent = `${seconds}秒後`;
    }
  } catch (error) {
    console.error('[視野予約] カウントダウンエラー:', error);
  }
}

// Canvas APIで2×2グリッドアイコンを描画
function drawIcon(isAvailable) {
  const canvas = document.getElementById('icon-canvas');
  const ctx = canvas.getContext('2d');
  const size = 96;
  const cellSize = size / 2;
  const borderRadius = size * 0.15;

  // 背景をクリア
  ctx.clearRect(0, 0, size, size);

  if (isAvailable === null) {
    // データがない場合はグレー表示
    ctx.fillStyle = '#ccc';
    ctx.fillRect(0, 0, size, size);
    return;
  }

  // 背景色
  const bgColor = isAvailable ? '#27ae60' : '#dc3545';
  const themeColor = '#4CAF50'; // 濃い緑（視野予約）

  // 左上3マス（予約状況）
  ctx.fillStyle = bgColor;

  // 左上
  ctx.beginPath();
  ctx.moveTo(borderRadius, 0);
  ctx.lineTo(cellSize, 0);
  ctx.lineTo(cellSize, cellSize);
  ctx.lineTo(0, cellSize);
  ctx.lineTo(0, borderRadius);
  ctx.arcTo(0, 0, borderRadius, 0, borderRadius);
  ctx.closePath();
  ctx.fill();

  // 右上
  ctx.beginPath();
  ctx.moveTo(cellSize, 0);
  ctx.lineTo(size - borderRadius, 0);
  ctx.arcTo(size, 0, size, borderRadius, borderRadius);
  ctx.lineTo(size, cellSize);
  ctx.lineTo(cellSize, cellSize);
  ctx.closePath();
  ctx.fill();

  // 左下
  ctx.beginPath();
  ctx.moveTo(0, cellSize);
  ctx.lineTo(cellSize, cellSize);
  ctx.lineTo(cellSize, size);
  ctx.lineTo(borderRadius, size);
  ctx.arcTo(0, size, 0, size - borderRadius, borderRadius);
  ctx.lineTo(0, cellSize);
  ctx.closePath();
  ctx.fill();

  // 右下1マス（テーマカラー+文字）
  ctx.fillStyle = themeColor;
  ctx.beginPath();
  ctx.moveTo(cellSize, cellSize);
  ctx.lineTo(size, cellSize);
  ctx.lineTo(size, size - borderRadius);
  ctx.arcTo(size, size, size - borderRadius, size, borderRadius);
  ctx.lineTo(cellSize, size);
  ctx.lineTo(cellSize, cellSize);
  ctx.closePath();
  ctx.fill();

  // 白文字「野」を右下マスに描画
  ctx.fillStyle = 'white';
  ctx.font = `bold ${cellSize * 0.7}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('野', cellSize + cellSize / 2, cellSize + cellSize / 2);

  // 中央にマークを描画（空きあり:◯、満枠:✕）
  if (isAvailable) {
    // 空きあり：白い丸◯
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.6}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◯', size / 2, size / 2);
  } else {
    // 満枠：太いバツ✕（線で描画）
    ctx.strokeStyle = 'white';
    ctx.lineWidth = size * 0.12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(size * 0.3, size * 0.3);
    ctx.lineTo(size * 0.7, size * 0.7);
    ctx.moveTo(size * 0.7, size * 0.3);
    ctx.lineTo(size * 0.3, size * 0.7);
    ctx.stroke();
  }
}

// ポップアップが閉じられるときにカウントダウンを停止
window.addEventListener('unload', () => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});
