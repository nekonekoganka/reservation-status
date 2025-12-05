// 一般予約枠数表示 - Background Service Worker

const TIMESLOTS_URL = 'https://storage.googleapis.com/reservation-timeslots-fujiminohikari/timeslots.json';
const UPDATE_INTERVAL = 1; // 分

// インストール時・起動時の初期化
chrome.runtime.onInstalled.addListener(() => {
  console.log('[一般予約枠数] 拡張機能がインストールされました');
  updateStatus();
  setupAlarm();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('[一般予約枠数] 拡張機能が起動しました');
  updateStatus();
  setupAlarm();
});

// 定期更新のアラーム設定
function setupAlarm() {
  chrome.alarms.create('updateStatus', {
    periodInMinutes: UPDATE_INTERVAL
  });
  console.log(`[一般予約枠数] アラーム設定完了: ${UPDATE_INTERVAL}分ごとに更新`);
}

// アラームのリスナー
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateStatus') {
    console.log('[一般予約枠数] アラーム発火 - ステータス更新開始');
    updateStatus();
  }
});

// メイン処理: ステータス更新
async function updateStatus() {
  try {
    console.log('[一般予約枠数] ステータス更新を開始します...');

    // Cloud Storageからデータ取得
    const data = await fetchTimeslotsData();

    if (!data) {
      console.error('[一般予約枠数] データ取得に失敗しました');
      updateBadgeError();
      return;
    }

    console.log('[一般予約枠数] データ取得成功:', data);

    // 枠数をカウント
    const slotsCount = data.slots ? data.slots.length : 0;
    const displayText = data.displayText || '本日';

    // バッジを更新
    updateBadge(slotsCount, displayText, data.status);

    // ストレージに保存
    await chrome.storage.local.set({
      lastUpdate: new Date().toISOString(),
      slots: data.slots || [],
      slotsCount: slotsCount,
      displayText: displayText,
      status: data.status,
      date: data.date,
      error: false
    });

    console.log('[一般予約枠数] ステータス更新完了');

  } catch (error) {
    console.error('[一般予約枠数] ステータス更新エラー:', error);
    updateBadgeError();
  }
}

// Cloud StorageからJSONデータを取得
async function fetchTimeslotsData() {
  try {
    const response = await fetch(TIMESLOTS_URL + '?t=' + Date.now()); // キャッシュ回避
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[一般予約枠数] JSONデータ取得:', data);

    return data;

  } catch (error) {
    console.error('[一般予約枠数] データ取得エラー:', error);
    return null;
  }
}

// バッジを更新
async function updateBadge(slotsCount, displayText, status) {
  // 最終更新時刻と次回更新時刻を取得
  const data = await chrome.storage.local.get(['lastUpdate']);
  const lastUpdate = data.lastUpdate ? new Date(data.lastUpdate) : new Date();
  const nextUpdate = new Date(lastUpdate.getTime() + 60000); // 1分後
  const now = new Date();
  const secondsUntilNext = Math.max(0, Math.floor((nextUpdate - now) / 1000));

  const timeStr = lastUpdate.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // ツールチップを作成
  let statusText;
  if (status === 'error') {
    statusText = '⚠エラー';
  } else if (slotsCount > 0) {
    statusText = `残り${slotsCount}枠`;
  } else {
    statusText = '✕満枠';
  }

  const title = `予約枠数（一般）: ${displayText} ${statusText}\n最終更新: ${timeStr}\n次回更新: ${secondsUntilNext}秒後`;

  chrome.action.setTitle({ title });
  console.log(`[一般予約枠数] バッジ更新: ${displayText} ${statusText}`);

  // アイコンを動的に生成
  createIcon(slotsCount, status);
}

// エラー時のバッジ更新
async function updateBadgeError() {
  const data = await chrome.storage.local.get(['lastUpdate']);
  const lastUpdate = data.lastUpdate ? new Date(data.lastUpdate) : null;
  const timeStr = lastUpdate ? lastUpdate.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  }) : '--:--';

  const title = `予約枠数（一般）: エラー\n最終更新: ${timeStr}`;
  chrome.action.setTitle({ title });
  console.log('[一般予約枠数] バッジ更新: エラー');

  // エラーアイコンを生成・表示
  createIcon(0, 'error');

  // エラーフラグを保存
  await chrome.storage.local.set({ error: true });
}

// Canvas APIでアイコンを動的生成
function createIcon(slotsCount, status) {
  const sizes = [16, 48, 128];
  const imageDataSet = {};

  sizes.forEach(size => {
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const cellSize = size / 2;
    const borderRadius = size * 0.15;

    // 枠数 > 0 の場合はオレンジ背景+白抜き数字のデザイン
    if (status !== 'error' && slotsCount > 0) {
      // オレンジ背景で塗りつぶし
      ctx.fillStyle = '#CC6600'; // オレンジ色（一般予約のテーマカラー）
      ctx.fillRect(0, 0, size, size);

      // 白抜きの太い数字を最大サイズで表示
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 数字のサイズをさらに大きく（1桁は95%、2桁は80%）
      const fontSize = slotsCount >= 10 ? size * 0.8 : size * 0.95;
      ctx.font = `bold ${fontSize}px sans-serif`;

      // 視覚的な中央に配置（フォントメトリクスの補正）
      const offsetY = fontSize * 0.07;
      ctx.fillText(slotsCount.toString(), size / 2, size / 2 + offsetY);
    } else {
      // 枠数 = 0 またはエラーの場合は既存のデザイン（2×2グリッド）
      // 背景色を決定
      let bgColor;
      if (status === 'error') {
        bgColor = '#FFA500'; // オレンジ（エラー時）
      } else {
        bgColor = '#dc3545'; // 赤（満枠）
      }
      const themeColor = '#F57C00'; // オレンジ（一般予約のテーマカラー）

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

      // 白文字「一」を右下マスに描画
      ctx.fillStyle = 'white';
      ctx.font = `bold ${cellSize * 0.7}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('一', cellSize + cellSize / 2, cellSize + cellSize / 2);

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

    // ImageDataを取得
    const imageData = ctx.getImageData(0, 0, size, size);
    imageDataSet[size] = imageData;
  });

  // 全サイズのアイコンを一度に設定
  chrome.action.setIcon({ imageData: imageDataSet });
}

// ポップアップからのメッセージを受信
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateNow') {
    console.log('[一般予約枠数] 手動更新が要求されました');
    updateStatus().then(() => {
      sendResponse({ success: true });
    });
    return true; // 非同期応答を示す
  }
});

// 初回実行
updateStatus();
setupAlarm();
