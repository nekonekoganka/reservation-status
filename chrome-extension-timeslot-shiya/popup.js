// ポップアップのロジック

let countdownInterval = null;
let currentSlots = [];

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
        btn.innerHTML = '🔄 更新';
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

// 日付から適切な表示テキストを計算（月/日形式）
function calculateDisplayTextWithDate(targetDate) {
  if (!targetDate) {
    return '本日';
  }

  const now = new Date();
  const currentDate = now.getDate();
  const currentMonth = now.getMonth() + 1;

  // 対象日が今月か来月かを判定
  let targetMonth = currentMonth;
  if (targetDate < currentDate) {
    // 日付が小さい場合は来月と判断
    targetMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  }

  // 本日/明日/次の診療日を判定
  let displayText;
  if (targetDate === currentDate) {
    displayText = '本日';
  } else if (targetDate === currentDate + 1) {
    displayText = '明日';
  } else {
    displayText = '次の診療日';
  }

  return `${displayText}（${targetMonth}/${targetDate}）`;
}

// ステータスを読み込んで表示
async function loadStatus() {
  try {
    const data = await chrome.storage.local.get([
      'lastUpdate',
      'slots',
      'slotsCount',
      'displayText',
      'status',
      'date',
      'error'
    ]);

    // エラーチェック
    const hasError = data.error || !data.lastUpdate;
    const slotsCount = data.slotsCount || 0;

    // ステータステキスト
    const statusText = document.getElementById('status-text');
    if (hasError) {
      statusText.textContent = 'データ取得エラー';
      statusText.className = 'status-text error';
    } else if (slotsCount > 0) {
      statusText.textContent = `残り${slotsCount}枠`;
      statusText.className = 'status-text available';
    } else {
      statusText.textContent = '✕ 満枠';
      statusText.className = 'status-text full';
    }

    // 日付付きの表示テキストを計算
    const displayText = calculateDisplayTextWithDate(data.date);
    document.getElementById('day-text').textContent = displayText;

    // 時間枠リストを表示
    currentSlots = data.slots || [];
    displayTimeslots(currentSlots, slotsCount);

    // アイコンを描画
    drawIcon(slotsCount, data.status);

    // 最終更新時刻
    if (data.lastUpdate) {
      const lastUpdate = new Date(data.lastUpdate);
      const timeStr = lastUpdate.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
      });
      document.getElementById('last-update').textContent = timeStr;
    } else {
      document.getElementById('last-update').textContent = '--:--';
    }

  } catch (error) {
    console.error('[視野予約枠数] ステータス読み込みエラー:', error);
  }
}

// 時間枠が午前か午後かを判定（14時より前が午前、14時以降が午後）
function getTimeSlotPeriod(slot) {
  // "09:00" や "15:30" のような形式から時間を抽出
  const match = slot.match(/^(\d{1,2}):/);
  if (match) {
    const hour = parseInt(match[1], 10);
    return hour < 14 ? 'am' : 'pm';
  }
  return '';
}

// 時間枠リストを表示（全枠表示、AM/PM色分け）
function displayTimeslots(slots, slotsCount) {
  const timeslotsSection = document.getElementById('timeslots-section');
  const timeslotsList = document.getElementById('timeslots-list');

  if (slotsCount > 0 && slots.length > 0) {
    timeslotsSection.style.display = 'block';

    // 全ての時間枠を表示（AM/PM色分け）
    const html = slots.map(slot => {
      const period = getTimeSlotPeriod(slot);
      return `
        <div class="timeslot-item ${period}">
          <span>${slot}</span>
        </div>
      `;
    }).join('');

    timeslotsList.innerHTML = html;
  } else {
    timeslotsSection.style.display = 'block';
    timeslotsList.innerHTML = '<div class="no-slots">空き枠はありません</div>';
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
      document.getElementById('next-update').textContent = '--秒';
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
      document.getElementById('next-update').textContent = `${seconds}秒`;
    }
  } catch (error) {
    console.error('[視野予約枠数] カウントダウンエラー:', error);
  }
}

// Canvas APIでアイコンを描画（予約状況チェッカーと同じスタイル）
function drawIcon(slotsCount, status) {
  const canvas = document.getElementById('icon-canvas');
  const ctx = canvas.getContext('2d');
  const size = 80;
  const themeColor = '#006633'; // 緑（視野予約のテーマカラー）

  // 背景をクリア
  ctx.clearRect(0, 0, size, size);

  // 枠数 > 0 の場合は白背景+色枠+テーマカラー数字のデザイン
  if (status !== 'error' && slotsCount > 0) {
    const borderWidth = Math.max(1, Math.round(size * 0.08)); // 枠線の太さ（8%、最小1px）

    // 白背景で塗りつぶし
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, size, size);

    // 外枠を描画
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(borderWidth / 2, borderWidth / 2, size - borderWidth, size - borderWidth);

    // テーマカラーの太い数字を最大サイズで表示
    ctx.fillStyle = themeColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 数字のサイズ（1桁は95%、2桁は80%）
    const fontSize = slotsCount >= 10 ? size * 0.8 : size * 0.95;
    ctx.font = `bold ${fontSize}px sans-serif`;

    // 中央に配置
    ctx.fillText(slotsCount.toString(), size / 2, size / 2);
  } else {
    // 枠数 = 0 またはエラーの場合は2×2グリッドデザイン
    const cellSize = size / 2;
    const borderRadius = size * 0.15;

    // 背景色を決定
    let bgColor;
    if (status === 'error') {
      bgColor = '#FFA500'; // オレンジ（エラー時）
    } else {
      bgColor = '#dc3545'; // 赤（満枠）
    }

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

    // 白文字「視」を右下マスに描画
    ctx.fillStyle = 'white';
    ctx.font = `bold ${cellSize * 0.7}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('視', cellSize + cellSize / 2, cellSize + cellSize / 2);

    // 中央にマークを描画
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (status === 'error') {
      // エラー：⚠マーク
      ctx.fillStyle = 'white';
      ctx.font = `bold ${size * 0.6}px sans-serif`;
      ctx.fillText('⚠', size / 2, size / 2);
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
}

// ポップアップが閉じられるときにカウントダウンを停止
window.addEventListener('unload', () => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});
