// ポップアップのロジック（統合版）

let countdownInterval = null;

// 現在のスロットデータ
const currentSlotsData = {
  general: [],
  shiya: []
};

// 履歴データURL
const HISTORY_URLS = {
  general: 'https://storage.googleapis.com/fujimino-reservation-status/history-general',
  shiya: 'https://storage.googleapis.com/fujimino-reservation-status/history-shiya'
};

// 現在データURL（Background.jsと同じURLを使用）
const CURRENT_URLS = {
  general: 'https://storage.googleapis.com/reservation-timeslots-fujiminohikari/timeslots.json',
  shiya: 'https://storage.googleapis.com/reservation-timeslots-fujiminohikari/timeslots-shiya.json'
};

// 埋まり時刻・空き時刻を追跡
const slotFillTimes = { general: {}, shiya: {} };
const slotOpenTimes = { general: {}, shiya: {} };

// 15分間隔の時間枠定義
const AM_SLOTS = ['10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '11:30', '11:45', '12:00', '12:15', '12:30', '12:45', '13:00'];
const PM_SLOTS = ['15:00', '15:15', '15:30', '15:45', '16:00', '16:15', '16:30', '16:45', '17:00', '17:15', '17:30', '17:45', '18:00'];

// 時間グループ定義
const hourGroups = [
  { hour: 10, slots: ['10:00', '10:15', '10:30', '10:45'], isAm: true },
  { hour: 11, slots: ['11:00', '11:15', '11:30', '11:45'], isAm: true },
  { hour: 12, slots: ['12:00', '12:15', '12:30', '12:45', '13:00'], isAm: true },
  { hour: 15, slots: ['15:00', '15:15', '15:30', '15:45'], isAm: false },
  { hour: 16, slots: ['16:00', '16:15', '16:30', '16:45'], isAm: false },
  { hour: 17, slots: ['17:00', '17:15', '17:30', '17:45', '18:00'], isAm: false }
];

// 現在時刻のスロットインデックスと割合を取得
function getCurrentTimePosition() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const totalMinutes = hour * 60 + minute;

  // 全スロットをフラット化
  const allSlots = hourGroups.flatMap(g => g.slots);

  // 営業時間前（10:00より前）→ 10:00の左端
  if (totalMinutes < 10 * 60) {
    return { index: 0, progress: 0, visible: true };
  }

  // 昼休み中（13:00〜15:00）→ 15:00の左端（PMスロットの最初）
  if (totalMinutes >= 13 * 60 && totalMinutes < 15 * 60) {
    // PMスロットの開始インデックス（13番目、0-indexed）
    const pmStartIndex = 13;
    return { index: pmStartIndex, progress: 0, visible: true };
  }

  // 営業時間後（18:00以降）→ 18:00の右端
  if (totalMinutes >= 18 * 60) {
    return { index: allSlots.length - 1, progress: 1, visible: true };
  }

  // 各スロットの開始時刻（分）を計算
  for (let i = 0; i < allSlots.length; i++) {
    const slot = allSlots[i];
    const [slotHour, slotMin] = slot.split(':').map(Number);
    const slotStart = slotHour * 60 + slotMin;
    const slotEnd = slotStart + 15; // 15分枠

    if (totalMinutes >= slotStart && totalMinutes < slotEnd) {
      // このスロット内での位置を計算
      const progress = (totalMinutes - slotStart) / 15;
      return { index: i, progress: progress, visible: true };
    }
  }

  // フォールバック（通常はここに来ない）
  return { index: -1, progress: 0, visible: false };
}

// 日付フォーマット（YYYY-MM-DD）
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 当日の履歴データを取得
async function fetchTodayHistory(type) {
  try {
    const today = formatDate(new Date());
    const url = `${HISTORY_URLS[type]}/${today}.json?t=${Date.now()}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    console.log(`[予約枠数] ${type}履歴データ取得失敗:`, e);
    return null;
  }
}

// 現在のデータを直接取得
async function fetchCurrentSlots(type) {
  try {
    const url = `${CURRENT_URLS[type]}?t=${Date.now()}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    console.log(`[予約枠数] ${type}現在データ取得失敗:`, e);
    return null;
  }
}

// 履歴データから各スロットの「埋まった時刻」「空いた時刻」を計算
function analyzeSlotFillTimes(historyData, type) {
  if (!historyData || !Array.isArray(historyData)) return;

  // 時間順にソート
  const sortedData = [...historyData].sort((a, b) => {
    const timeA = a.time || '';
    const timeB = b.time || '';
    return timeA.localeCompare(timeB);
  });

  // 全スロットを追跡
  const allSlots = [...AM_SLOTS, ...PM_SLOTS];
  const mappedSlots = allSlots.map(slot => {
    if (slot === '13:00') return '12:55';
    if (slot === '18:00') return '17:55';
    return slot;
  });

  // 各スロットの状態を追跡
  let prevSlots = null;

  sortedData.forEach(entry => {
    const currentSlots = entry.slots || [];
    const recordTime = entry.time;

    if (prevSlots !== null) {
      mappedSlots.forEach((mappedSlot, index) => {
        const displaySlot = allSlots[index];
        const wasAvailable = prevSlots.includes(mappedSlot);
        const isNowAvailable = currentSlots.includes(mappedSlot);

        if (wasAvailable && !isNowAvailable) {
          slotFillTimes[type][displaySlot] = recordTime;
          delete slotOpenTimes[type][displaySlot];
        } else if (!wasAvailable && isNowAvailable) {
          slotOpenTimes[type][displaySlot] = recordTime;
          delete slotFillTimes[type][displaySlot];
        }
      });
    }

    prevSlots = currentSlots;
  });
}

// 埋まった時刻に基づいてクラス名を取得
function getFilledTimeClass(slot, type) {
  const filledAt = slotFillTimes[type][slot];
  if (!filledAt) return 'before';

  const now = new Date();
  const [filledHour, filledMin] = filledAt.split(':').map(Number);
  const filledTime = new Date();
  filledTime.setHours(filledHour, filledMin, 0, 0);

  const diffMinutes = (now - filledTime) / (1000 * 60);
  return diffMinutes <= 120 ? 'recent' : 'before';
}

// 空きになった時刻に基づいてクラス名を取得
function getOpenedTimeClass(slot, type) {
  const openedAt = slotOpenTimes[type][slot];
  if (!openedAt) return null;

  const now = new Date();
  const [openedHour, openedMin] = openedAt.split(':').map(Number);
  const openedTime = new Date();
  openedTime.setHours(openedHour, openedMin, 0, 0);

  const diffMinutes = (now - openedTime) / (1000 * 60);
  return diffMinutes <= 120 ? 'recently-opened' : null;
}

// スロットが空きかどうかをチェック
function isSlotAvailable(slot, availableSlots) {
  if (slot === '13:00') {
    return availableSlots.includes('12:55') || availableSlots.includes('13:00');
  }
  if (slot === '18:00') {
    return availableSlots.includes('17:55') || availableSlots.includes('18:00');
  }
  return availableSlots.includes(slot);
}

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

// 日付から適切な表示テキストを計算
function calculateDisplayTextWithDate(targetDate) {
  if (!targetDate) {
    return '本日';
  }

  const now = new Date();
  const currentDate = now.getDate();
  const currentMonth = now.getMonth() + 1;

  let targetMonth = currentMonth;
  if (targetDate < currentDate) {
    targetMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  }

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
    // ストレージから一般予約データを取得
    const generalData = await chrome.storage.local.get([
      'lastUpdate', 'slots', 'slotsCount', 'status', 'date', 'error'
    ]);

    // 視野予約データを直接取得
    const shiyaData = await fetchCurrentSlots('shiya');

    // 一般予約を更新
    const generalSlots = generalData.slots || [];
    const generalCount = generalData.slotsCount || 0;
    const hasGeneralError = generalData.error || !generalData.lastUpdate;

    currentSlotsData.general = generalSlots;
    updateStatusDisplay('general', generalCount, hasGeneralError, generalData.status);
    displayTimeslotsList('general', generalSlots, generalCount);

    // 視野予約を更新
    const shiyaSlots = shiyaData?.slots || [];
    const shiyaCount = shiyaSlots.length;
    const hasShiyaError = !shiyaData;

    currentSlotsData.shiya = shiyaSlots;
    updateStatusDisplay('shiya', shiyaCount, hasShiyaError, hasShiyaError ? 'error' : (shiyaCount > 0 ? 'ok' : 'full'));
    displayTimeslotsList('shiya', shiyaSlots, shiyaCount);

    // 日付表示
    const displayText = calculateDisplayTextWithDate(generalData.date);
    document.getElementById('day-text').textContent = displayText;

    // 最終更新時刻
    if (generalData.lastUpdate) {
      const lastUpdate = new Date(generalData.lastUpdate);
      const timeStr = lastUpdate.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
      });
      document.getElementById('last-update').textContent = timeStr;
    } else {
      document.getElementById('last-update').textContent = '--:--';
    }

    // 統合タイムラインを描画
    renderCombinedTimeline();

    // 履歴データを非同期で取得してアニメーションを適用
    Promise.all([
      fetchTodayHistory('general'),
      fetchTodayHistory('shiya')
    ]).then(([generalHistory, shiyaHistory]) => {
      if (generalHistory) {
        analyzeSlotFillTimes(generalHistory, 'general');
      }
      if (shiyaHistory) {
        analyzeSlotFillTimes(shiyaHistory, 'shiya');
      }
      renderCombinedTimeline();
    });

  } catch (error) {
    console.error('[予約枠数] ステータス読み込みエラー:', error);
  }
}

// ステータス表示を更新
function updateStatusDisplay(type, count, hasError, status) {
  const countElement = document.getElementById(`count-${type}`);
  const statusTextElement = document.getElementById(`status-text-${type}`);

  if (hasError) {
    countElement.textContent = 'エラー';
    countElement.className = `status-card-count ${type}`;
    statusTextElement.textContent = 'データ取得エラー';
    statusTextElement.className = 'status-text error';
  } else if (count > 0) {
    countElement.textContent = `残り${count}枠`;
    countElement.className = `status-card-count ${type}`;
    statusTextElement.textContent = '○ 空きあり';
    statusTextElement.className = 'status-text available';
  } else {
    countElement.textContent = '満枠';
    countElement.className = `status-card-count ${type} full`;
    statusTextElement.textContent = '✕ 満枠';
    statusTextElement.className = 'status-text full';
  }

  // アイコンを描画
  drawIcon(type, count, status);
}

// 時間枠が午前か午後かを判定
function getTimeSlotPeriod(slot) {
  const match = slot.match(/^(\d{1,2}):/);
  if (match) {
    const hour = parseInt(match[1], 10);
    return hour < 14 ? 'am' : 'pm';
  }
  return '';
}

// 時間枠リストを表示
function displayTimeslotsList(type, slots, count) {
  const listElement = document.getElementById(`timeslots-list-${type}`);

  if (count > 0 && slots.length > 0) {
    const html = slots.map(slot => {
      const period = getTimeSlotPeriod(slot);
      return `<div class="timeslot-item ${period}"><span>${slot}</span></div>`;
    }).join('');
    listElement.innerHTML = html;
  } else {
    listElement.innerHTML = '<div class="no-slots">空き枠なし</div>';
  }
}

// 統合タイムラインを描画
function renderCombinedTimeline() {
  const container = document.getElementById('combined-timeline');
  if (!container) return;

  const generalSlots = currentSlotsData.general || [];
  const shiyaSlots = currentSlotsData.shiya || [];

  let html = '<table>';

  // 時間ヘッダー行
  html += '<tr class="hour-row">';
  html += '<th class="label-header"></th>';
  hourGroups.forEach(group => {
    const headerClass = group.isAm ? 'am-header' : 'pm-header';
    html += `<th colspan="${group.slots.length}" class="${headerClass}">${group.hour}</th>`;
  });
  html += '</tr>';

  // 分ヘッダー行
  html += '<tr class="minute-row">';
  html += '<th class="label-header"></th>';
  hourGroups.forEach(group => {
    group.slots.forEach(slot => {
      const minute = slot.split(':')[1];
      const baseClass = group.isAm ? 'am-minute' : 'pm-minute';
      const hourStartClass = (minute === '00' && slot !== '13:00' && slot !== '18:00') ? ' hour-start' : '';
      const displayMinute = (slot === '13:00' || slot === '18:00') ? '55' : minute;
      html += `<th class="${baseClass}${hourStartClass}">${displayMinute}</th>`;
    });
  });
  html += '</tr>';

  // 一般予約セル行
  html += '<tr class="cell-row">';
  html += '<td class="row-label general">一般</td>';
  hourGroups.forEach(group => {
    group.slots.forEach(slot => {
      const isAvailable = isSlotAvailable(slot, generalSlots);
      const minute = slot.split(':')[1];
      const hourStartClass = (minute === '00' && slot !== '13:00' && slot !== '18:00') ? ' hour-start' : '';

      let cellClass = isAvailable ? 'cell-available' : 'cell-filled general';
      let stateClass = '';

      if (!isAvailable) {
        const timeClass = getFilledTimeClass(slot, 'general');
        if (timeClass === 'recent') {
          stateClass = ' recent';
        }
      } else {
        const openedClass = getOpenedTimeClass(slot, 'general');
        if (openedClass) {
          stateClass = ' recently-opened general';
        }
      }

      let displaySlot = slot;
      if (slot === '13:00') displaySlot = '12:55';
      if (slot === '18:00') displaySlot = '17:55';

      let tooltip = '';
      if (!isAvailable) {
        const filledAt = slotFillTimes.general[slot];
        tooltip = filledAt ? `${displaySlot} (${filledAt}に埋まり)` : `${displaySlot} (元から埋まり)`;
      } else {
        const openedAt = slotOpenTimes.general[slot];
        tooltip = openedAt ? `${displaySlot} (${openedAt}に空き)` : `${displaySlot} 空き`;
      }

      html += `<td class="${cellClass}${stateClass}${hourStartClass}" title="${tooltip}"></td>`;
    });
  });
  html += '</tr>';

  // 視野予約セル行
  html += '<tr class="cell-row">';
  html += '<td class="row-label shiya">視野</td>';
  hourGroups.forEach(group => {
    group.slots.forEach(slot => {
      const isAvailable = isSlotAvailable(slot, shiyaSlots);
      const minute = slot.split(':')[1];
      const hourStartClass = (minute === '00' && slot !== '13:00' && slot !== '18:00') ? ' hour-start' : '';

      let cellClass = isAvailable ? 'cell-available' : 'cell-filled shiya';
      let stateClass = '';

      if (!isAvailable) {
        const timeClass = getFilledTimeClass(slot, 'shiya');
        if (timeClass === 'recent') {
          stateClass = ' recent';
        }
      } else {
        const openedClass = getOpenedTimeClass(slot, 'shiya');
        if (openedClass) {
          stateClass = ' recently-opened shiya';
        }
      }

      let displaySlot = slot;
      if (slot === '13:00') displaySlot = '12:55';
      if (slot === '18:00') displaySlot = '17:55';

      let tooltip = '';
      if (!isAvailable) {
        const filledAt = slotFillTimes.shiya[slot];
        tooltip = filledAt ? `${displaySlot} (${filledAt}に埋まり)` : `${displaySlot} (元から埋まり)`;
      } else {
        const openedAt = slotOpenTimes.shiya[slot];
        tooltip = openedAt ? `${displaySlot} (${openedAt}に空き)` : `${displaySlot} 空き`;
      }

      html += `<td class="${cellClass}${stateClass}${hourStartClass}" title="${tooltip}"></td>`;
    });
  });
  html += '</tr>';

  html += '</table>';
  container.innerHTML = html;

  // 現在時刻マーカーを追加
  updateCurrentTimeMarker();
}

// 現在時刻マーカーを更新
function updateCurrentTimeMarker() {
  const container = document.getElementById('combined-timeline');
  if (!container) return;

  // 既存のマーカーを削除
  const existingMarker = container.querySelector('.current-time-marker');
  if (existingMarker) {
    existingMarker.remove();
  }

  const timePos = getCurrentTimePosition();
  if (!timePos.visible) return;

  const table = container.querySelector('table');
  if (!table) return;

  // テーブルの最初の行からセルの位置を取得
  const firstRow = table.querySelector('tr');
  if (!firstRow) return;

  const cells = firstRow.querySelectorAll('th');
  if (cells.length < 2) return;

  // ラベル列の幅 (40px固定) + スロットインデックスに基づく位置を計算
  const labelWidth = 40;
  const tableWidth = table.offsetWidth;
  const slotsAreaWidth = tableWidth - labelWidth;
  const totalSlots = hourGroups.flatMap(g => g.slots).length;
  const slotWidth = slotsAreaWidth / totalSlots;

  // マーカーの位置を計算
  const markerLeft = labelWidth + (timePos.index + timePos.progress) * slotWidth;

  // マーカー要素を作成
  const marker = document.createElement('div');
  marker.className = 'current-time-marker';
  marker.style.left = markerLeft + 'px';
  marker.title = `現在時刻: ${new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`;

  container.appendChild(marker);
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
      document.getElementById('next-update').textContent = '--';
      return;
    }

    const lastUpdate = new Date(data.lastUpdate);
    const nextUpdate = new Date(lastUpdate.getTime() + 60000);
    const now = new Date();
    const diff = nextUpdate - now;

    if (diff <= 0) {
      document.getElementById('next-update').textContent = '0';
    } else {
      const seconds = Math.floor(diff / 1000);
      document.getElementById('next-update').textContent = seconds;
    }
  } catch (error) {
    console.error('[予約枠数] カウントダウンエラー:', error);
  }
}

// Canvas APIでアイコンを描画
function drawIcon(type, slotsCount, status) {
  const canvas = document.getElementById(`icon-canvas-${type}`);
  const ctx = canvas.getContext('2d');
  const size = 80;
  const themeColor = type === 'general' ? '#CC6600' : '#006633';
  const labelText = type === 'general' ? '一' : '視';

  ctx.clearRect(0, 0, size, size);

  if (status !== 'error' && slotsCount > 0) {
    const borderWidth = Math.max(1, Math.round(size * 0.08));

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = themeColor;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(borderWidth / 2, borderWidth / 2, size - borderWidth, size - borderWidth);

    ctx.fillStyle = themeColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const fontSize = slotsCount >= 10 ? size * 0.8 : size * 0.95;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillText(slotsCount.toString(), size / 2, size / 2);
  } else {
    const cellSize = size / 2;
    const borderRadius = size * 0.15;

    let bgColor;
    if (status === 'error') {
      bgColor = '#FFA500';
    } else {
      bgColor = '#dc3545';
    }

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

    // 右下
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

    ctx.fillStyle = 'white';
    ctx.font = `bold ${cellSize * 0.7}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, cellSize + cellSize / 2, cellSize + cellSize / 2);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (status === 'error') {
      ctx.fillStyle = 'white';
      ctx.font = `bold ${size * 0.6}px sans-serif`;
      ctx.fillText('⚠', size / 2, size / 2);
    } else {
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
