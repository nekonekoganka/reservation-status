/**
 * 予約状況インジケーター - Background Service Worker
 *
 * 一般予約と視野予約の状況を定期的に取得し、バッジに表示
 */

// スプレッドシートの設定
const SPREADSHEET_ID = '1RSd9aC5B_-gQ1_j5V1aQcZn1iVw9v8mpmhJ78_8gY80';
const GENERAL_SHEET_NAME = 'フォームの回答 1';
const SHIYA_SHEET_NAME = 'フォームの回答_視野予約';

// アラーム名
const ALARM_NAME = 'statusCheckAlarm';

// 更新間隔（分）
const UPDATE_INTERVAL_MINUTES = 1;

/**
 * 拡張機能インストール時の処理
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('予約状況インジケーター: インストールされました');

  // アラームを設定
  setupAlarm();

  // 初回の状態チェック
  checkReservationStatus();
});

/**
 * Service Worker起動時の処理
 */
chrome.runtime.onStartup.addListener(() => {
  console.log('予約状況インジケーター: 起動しました');

  // アラームを設定
  setupAlarm();

  // 初回の状態チェック
  checkReservationStatus();
});

/**
 * アラームを設定する関数
 */
function setupAlarm() {
  // 既存のアラームをクリア
  chrome.alarms.clear(ALARM_NAME, (wasCleared) => {
    if (wasCleared) {
      console.log('予約状況インジケーター: 既存のアラームをクリアしました');
    }

    // 新しいアラームを作成
    chrome.alarms.create(ALARM_NAME, {
      periodInMinutes: UPDATE_INTERVAL_MINUTES
    });

    console.log(`予約状況インジケーター: アラームを設定しました（${UPDATE_INTERVAL_MINUTES}分ごと）`);
  });
}

/**
 * アラーム発火時の処理
 */
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    console.log('予約状況インジケーター: アラーム発火 - 状態チェックを実行します');
    checkReservationStatus();
  }
});

/**
 * スプレッドシートから最新の予約状況を取得
 */
async function fetchSheetData(sheetName) {
  const apiUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;

  try {
    const response = await fetch(apiUrl);
    const text = await response.text();

    // JSONデータを抽出（Google特有の形式）
    const json = JSON.parse(text.substring(47).slice(0, -2));

    // データの行を取得
    const rows = json.table.rows;

    if (rows.length === 0) {
      throw new Error('データがありません');
    }

    // 全ての行から最新のタイムスタンプを探す
    let latestRow = null;
    let latestDate = null;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.c && row.c[0] && row.c[0].v) {
        const timestampStr = row.c[0].f || row.c[0].v;
        const date = new Date(timestampStr);

        if (!latestDate || date > latestDate) {
          latestDate = date;
          latestRow = row;
        }
      }
    }

    if (!latestRow) {
      throw new Error('有効なデータがありません');
    }

    const timestamp = latestRow.c[0].f;
    const status = latestRow.c[1].v;
    const isAvailable = status.includes('空きあり');

    return {
      timestamp,
      status,
      isAvailable
    };

  } catch (error) {
    console.error(`エラー (${sheetName}):`, error);
    return null;
  }
}

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

/**
 * 予約状況をチェックしてバッジを更新
 */
async function checkReservationStatus() {
  try {
    // 2つのシートから並列でデータ取得
    const [generalData, shiyaData] = await Promise.all([
      fetchSheetData(GENERAL_SHEET_NAME),
      fetchSheetData(SHIYA_SHEET_NAME)
    ]);

    if (!generalData || !shiyaData) {
      // エラー時の表示
      updateBadge('?', '#6C757D', 'データ取得エラー');

      // storageに保存
      chrome.storage.local.set({
        generalStatus: null,
        shiyaStatus: null,
        lastUpdate: new Date().toISOString(),
        error: true
      });

      return;
    }

    // 日付テキストを計算
    const dayText = calculateDayText(new Date());

    // バッジを更新
    updateBadgeByStatus(generalData.isAvailable, shiyaData.isAvailable);

    // より新しいタイムスタンプを使用
    const generalDate = new Date(generalData.timestamp);
    const shiyaDate = new Date(shiyaData.timestamp);
    const latestTimestamp = generalDate > shiyaDate ? generalData.timestamp : shiyaData.timestamp;

    // storageに保存（ポップアップで使用）
    chrome.storage.local.set({
      generalStatus: {
        isAvailable: generalData.isAvailable,
        status: generalData.status,
        timestamp: generalData.timestamp,
        dayText: dayText
      },
      shiyaStatus: {
        isAvailable: shiyaData.isAvailable,
        status: shiyaData.status,
        timestamp: shiyaData.timestamp,
        dayText: dayText
      },
      lastUpdate: latestTimestamp,
      error: false
    });

    console.log('予約状況インジケーター: 状態を更新しました', {
      general: `${dayText} ${generalData.isAvailable ? '空き' : '満枠'}`,
      shiya: `${dayText} ${shiyaData.isAvailable ? '空き' : '満枠'}`
    });

  } catch (error) {
    console.error('予約状況インジケーター: エラーが発生しました', error);
    updateBadge('!', '#dc3545', 'エラー');

    chrome.storage.local.set({
      error: true,
      errorMessage: error.message
    });
  }
}

/**
 * バッジを状態に応じて更新
 */
function updateBadgeByStatus(generalAvailable, shiyaAvailable) {
  if (generalAvailable && shiyaAvailable) {
    // 両方空き
    updateBadge('2', '#27ae60', '両方空き');
  } else if (generalAvailable && !shiyaAvailable) {
    // 一般のみ空き
    updateBadge('G', '#ffc107', '一般のみ空き');
  } else if (!generalAvailable && shiyaAvailable) {
    // 視野のみ空き
    updateBadge('S', '#ffc107', '視野のみ空き');
  } else {
    // 両方満枠
    updateBadge('0', '#dc3545', '両方満枠');
  }
}

/**
 * バッジを更新する共通関数
 */
function updateBadge(text, color, title) {
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setTitle({ title: `予約状況: ${title}` });
}

// 初回起動時にアラームの状態を確認
chrome.alarms.getAll((alarms) => {
  console.log('予約状況インジケーター: 現在のアラーム:', alarms);
});
