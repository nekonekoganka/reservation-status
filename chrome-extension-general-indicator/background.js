// 一般予約インジケーター - Background Service Worker

const SPREADSHEET_ID = '1RSd9aC5B_-gQ1_j5V1aQcZn1iVw9v8mpmhJ78_8gY80';
const SHEET_NAME = 'フォームの回答 1';
const UPDATE_INTERVAL = 1; // 分

// インストール時・起動時の初期化
chrome.runtime.onInstalled.addListener(() => {
  console.log('[一般予約] 拡張機能がインストールされました');
  updateStatus();
  setupAlarm();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('[一般予約] 拡張機能が起動しました');
  updateStatus();
  setupAlarm();
});

// 定期更新のアラーム設定
function setupAlarm() {
  chrome.alarms.create('updateStatus', {
    periodInMinutes: UPDATE_INTERVAL
  });
  console.log(`[一般予約] アラーム設定完了: ${UPDATE_INTERVAL}分ごとに更新`);
}

// アラームのリスナー
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateStatus') {
    console.log('[一般予約] アラーム発火 - ステータス更新開始');
    updateStatus();
  }
});

/**
 * 日付テキストを計算する関数
 * display.htmlのcalculateDayText()と同じロジック
 */
function calculateDayText(updateTime) {
  const now = new Date(updateTime);
  const dayOfWeek = now.getDay(); // 0=日, 1=月, 2=火, 3=水...
  const hour = now.getHours();
  const minute = now.getMinutes();
  const isAfter1830 = (hour > 18) || (hour === 18 && minute >= 30);

  let dayText = '本日';

  if (isAfter1830) {
    // 18:30以降
    // 月末チェック
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    if (now.getDate() === lastDayOfMonth) {
      dayText = '翌営業日';
    } else if (dayOfWeek === 2) {
      // 火曜日
      dayText = '木曜';
    } else {
      dayText = '明日';
    }
  } else {
    // 18:30より前
    if (dayOfWeek === 3) {
      // 水曜日
      dayText = '木曜';
    } else {
      dayText = '本日';
    }
  }

  return dayText;
}

// メイン処理: ステータス更新
async function updateStatus() {
  try {
    console.log('[一般予約] ステータス更新を開始します...');

    // スプレッドシートからデータ取得
    const data = await fetchSheetData();

    if (!data) {
      console.error('[一般予約] データ取得に失敗しました');
      updateBadgeError();
      return;
    }

    console.log('[一般予約] データ取得成功:', data);

    // 日付テキストを計算
    const dayText = calculateDayText(new Date());

    // バッジを更新
    updateBadge(data.isAvailable ? 'available' : 'full', dayText);

    // ストレージに保存
    await chrome.storage.local.set({
      lastUpdate: new Date().toISOString(),
      status: data.status,
      isAvailable: data.isAvailable,
      timestamp: data.timestamp,
      dayText: dayText,
      error: false
    });

    console.log('[一般予約] ステータス更新完了');

  } catch (error) {
    console.error('[一般予約] ステータス更新エラー:', error);
    updateBadgeError();
  }
}

// スプレッドシートからデータ取得
async function fetchSheetData() {
  const apiUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    // Google SheetsのレスポンスからJSONを抽出
    const json = JSON.parse(text.substring(47).slice(0, -2));

    if (!json.table || !json.table.rows || json.table.rows.length === 0) {
      throw new Error('データが見つかりません');
    }

    // 最新行を取得（最後の行）
    const rows = json.table.rows;
    const lastRow = rows[rows.length - 1];

    if (!lastRow.c || lastRow.c.length < 2) {
      throw new Error('データ形式が不正です');
    }

    // タイムスタンプとステータスを取得
    const timestamp = lastRow.c[0]?.f || lastRow.c[0]?.v || '';
    const status = lastRow.c[1]?.v || '';

    // 空き状況を判定
    const isAvailable = status.includes('空きあり') || status.includes('空き');

    return {
      timestamp,
      status,
      isAvailable
    };

  } catch (error) {
    console.error('[一般予約] データ取得エラー:', error);
    return null;
  }
}

// バッジを更新
async function updateBadge(status, dayText) {
  // status: 'available' | 'full' | 'error'
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

  // ツールチップを拡張（日付情報を追加）
  const statusText = status === 'available' ? '◯空きあり' :
                     status === 'error' ? '⚠エラー' : '✕満枠';
  const title = `予約状況（一般）: ${dayText} ${statusText}\n最終更新: ${timeStr}\n次回更新: ${secondsUntilNext}秒後`;

  chrome.action.setTitle({ title });
  console.log(`[一般予約] バッジ更新: ${dayText} ${statusText}`);

  // アイコンを動的に生成
  createIcon(status);
}

// エラー時のバッジ更新
async function updateBadgeError() {
  const data = await chrome.storage.local.get(['lastUpdate']);
  const lastUpdate = data.lastUpdate ? new Date(data.lastUpdate) : null;
  const timeStr = lastUpdate ? lastUpdate.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  }) : '--:--';

  const title = `予約状況（一般）: エラー\n最終更新: ${timeStr}`;
  chrome.action.setTitle({ title });
  console.log('[一般予約] バッジ更新: エラー');

  // エラーアイコンを生成・表示
  createIcon('error');

  // エラーフラグを保存
  await chrome.storage.local.set({ error: true });
}

// Canvas APIでアイコンを動的生成
function createIcon(status) {
  // status: 'available' | 'full' | 'error'
  const sizes = [16, 48, 128];
  const imageDataSet = {};

  sizes.forEach(size => {
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const cellSize = size / 2;
    const borderRadius = size * 0.15;

    // 背景色
    let bgColor;
    if (status === 'error') {
      bgColor = '#FFA500'; // オレンジ（エラー時）
    } else if (status === 'available') {
      bgColor = '#27ae60'; // 緑（空きあり）
    } else {
      bgColor = '#dc3545'; // 赤（満枠）
    }
    const themeColor = '#F57C00'; // オレンジ（一般予約）

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

    // 中央にマークを描画（空きあり:◯、満枠:✕、エラー:⚠）
    if (status === 'error') {
      // エラー：⚠マーク
      ctx.fillStyle = 'white';
      ctx.font = `bold ${size * 0.6}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚠', size / 2, size / 2);
    } else if (status === 'available') {
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
    console.log('[一般予約] 手動更新が要求されました');
    updateStatus().then(() => {
      sendResponse({ success: true });
    });
    return true; // 非同期応答を示す
  }
});

// 初回実行
updateStatus();
setupAlarm();
