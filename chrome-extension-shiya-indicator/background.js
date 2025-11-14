// 視野予約インジケーター - Background Service Worker

const SPREADSHEET_ID = '1RSd9aC5B_-gQ1_j5V1aQcZn1iVw9v8mpmhJ78_8gY80';
const SHEET_NAME = 'フォームの回答_視野予約';
const UPDATE_INTERVAL = 1; // 分

// インストール時・起動時の初期化
chrome.runtime.onInstalled.addListener(() => {
  console.log('[視野予約] 拡張機能がインストールされました');
  updateStatus();
  setupAlarm();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('[視野予約] 拡張機能が起動しました');
  updateStatus();
  setupAlarm();
});

// 定期更新のアラーム設定
function setupAlarm() {
  chrome.alarms.create('updateStatus', {
    periodInMinutes: UPDATE_INTERVAL
  });
  console.log(`[視野予約] アラーム設定完了: ${UPDATE_INTERVAL}分ごとに更新`);
}

// アラームのリスナー
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateStatus') {
    console.log('[視野予約] アラーム発火 - ステータス更新開始');
    updateStatus();
  }
});

// メイン処理: ステータス更新
async function updateStatus() {
  try {
    console.log('[視野予約] ステータス更新を開始します...');

    // スプレッドシートからデータ取得
    const data = await fetchSheetData();

    if (!data) {
      console.error('[視野予約] データ取得に失敗しました');
      updateBadgeError();
      return;
    }

    console.log('[視野予約] データ取得成功:', data);

    // バッジを更新
    updateBadge(data.isAvailable);

    // ストレージに保存
    await chrome.storage.local.set({
      lastUpdate: new Date().toISOString(),
      status: data.status,
      isAvailable: data.isAvailable,
      timestamp: data.timestamp
    });

    console.log('[視野予約] ステータス更新完了');

  } catch (error) {
    console.error('[視野予約] ステータス更新エラー:', error);
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
    console.error('[視野予約] データ取得エラー:', error);
    return null;
  }
}

// バッジを更新
function updateBadge(isAvailable) {
  if (isAvailable) {
    // 空きあり: アイコンは緑
    chrome.action.setTitle({ title: '予約状況（視野）: 空きあり' });
    console.log('[視野予約] バッジ更新: 空きあり（緑）');
  } else {
    // 満枠: アイコンは赤+白バツ
    chrome.action.setTitle({ title: '予約状況（視野）: 満枠' });
    console.log('[視野予約] バッジ更新: 満枠（赤+白バツ）');
  }

  // アイコンを動的に生成
  createIcon(isAvailable);
}

// エラー時のバッジ更新
function updateBadgeError() {
  chrome.action.setTitle({ title: '予約状況（視野）: エラー' });
  console.log('[視野予約] バッジ更新: エラー');
}

// Canvas APIでアイコンを動的生成
function createIcon(isAvailable) {
  const sizes = [16, 48, 128];
  const imageDataSet = {};

  sizes.forEach(size => {
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const cellSize = size / 2;
    const borderRadius = size * 0.15;

    // 背景色
    const bgColor = isAvailable ? '#27ae60' : '#dc3545'; // 緑 or 赤
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
    ctx.fillRect(0, cellSize, cellSize, cellSize);

    // 右下1マス（テーマカラー+文字）
    ctx.fillStyle = themeColor;
    ctx.beginPath();
    ctx.moveTo(cellSize, cellSize);
    ctx.lineTo(size, cellSize);
    ctx.lineTo(size, size - borderRadius);
    ctx.arcTo(size, size, size - borderRadius, size, borderRadius);
    ctx.lineTo(borderRadius, size);
    ctx.arcTo(0, size, 0, size - borderRadius, borderRadius);
    ctx.lineTo(0, cellSize);
    ctx.lineTo(cellSize, cellSize);
    ctx.closePath();
    ctx.fill();

    // 白文字「野」を右下マスに描画
    ctx.fillStyle = 'white';
    ctx.font = `bold ${cellSize * 0.7}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('野', cellSize + cellSize / 2, cellSize + cellSize / 2);

    // 満枠の場合は白バツを中央に描画
    if (!isAvailable) {
      ctx.fillStyle = 'white';
      ctx.font = `bold ${size * 0.6}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✕', size / 2, size / 2);
    }

    // ImageDataを取得
    const imageData = ctx.getImageData(0, 0, size, size);
    imageDataSet[size] = imageData;
  });

  // 全サイズのアイコンを一度に設定
  chrome.action.setIcon({ imageData: imageDataSet });
}

// 初回実行
updateStatus();
setupAlarm();
