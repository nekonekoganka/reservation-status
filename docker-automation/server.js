/**
 * 予約状況自動チェックシステム（Docker版）
 *
 * 既存のChrome拡張機能（chrome-extension/content.js）のロジックを移植
 * Cloud Scheduler + Cloud Run で2分ごとに自動実行
 */

require('dotenv').config();
const express = require('express');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 8080;

// 環境変数から設定を取得
const RESERVATION_URL = process.env.RESERVATION_URL || 'https://ckreserve.com/clinic/fujiminohikari-ganka';
const GOOGLE_APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL;

// タイムゾーンを Asia/Tokyo に設定
process.env.TZ = 'Asia/Tokyo';

/**
 * チェックする日付を計算する関数
 * chrome-extension/content.js の calculateTargetDate() を移植
 *
 * @returns {Object} {targetDate: number|null, displayText: string}
 */
function calculateTargetDate() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=日, 1=月, 2=火, 3=水, 4=木, 5=金, 6=土
  const hour = now.getHours();
  const minute = now.getMinutes();

  // 18:30以降かチェック
  const isAfter1830 = (hour > 18) || (hour === 18 && minute >= 30);

  let daysToAdd = 0;
  let displayText = '本日';

  if (isAfter1830) {
    // 18:30以降の処理

    // 月末チェック
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    if (now.getDate() === lastDayOfMonth) {
      // 月末の18:30以降は自動判定しない
      console.log('月末18:30以降のため、自動判定をスキップします');
      return { targetDate: null, displayText: '翌営業日' };
    }

    // 火曜日（dayOfWeek === 2）の18:30以降
    if (dayOfWeek === 2) {
      daysToAdd = 2; // 木曜日をチェック
      displayText = '木曜';
    } else {
      daysToAdd = 1; // 明日をチェック
      displayText = '明日';
    }
  } else {
    // 18:30より前の処理

    // 水曜日（dayOfWeek === 3）
    if (dayOfWeek === 3) {
      daysToAdd = 1; // 木曜日をチェック
      displayText = '木曜';
    } else {
      daysToAdd = 0; // 本日をチェック
      displayText = '本日';
    }
  }

  // 計算した日付を取得
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + daysToAdd);

  return { targetDate: targetDate.getDate(), displayText: displayText };
}

/**
 * Puppeteerで予約ページをチェックする関数
 */
async function checkReservationStatus() {
  console.log('=== 予約状況チェック開始 ===');
  console.log('時刻:', new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }));

  let browser = null;

  try {
    // チェックする日付を計算
    const { targetDate, displayText } = calculateTargetDate();

    // 月末の18:30以降は静かに終了
    if (targetDate === null) {
      console.log('月末のため処理を終了します');
      return { success: true, skipped: true, reason: 'end-of-month' };
    }

    console.log(`チェック対象: ${displayText}分 (${targetDate}日)`);

    // Puppeteerブラウザを起動
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--ignore-certificate-errors',
        '--disable-web-security'
      ]
    });

    const page = await browser.newPage();

    // User-Agentを設定（通常のブラウザとして振る舞う）
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // ビューポートを設定
    await page.setViewport({ width: 1280, height: 800 });

    // ページに移動（タイムアウトを60秒に延長）
    console.log('予約ページにアクセス中...');
    await page.goto(RESERVATION_URL, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log('ページ読み込み完了');

    // カレンダーの読み込みを待つ（タイムアウトを30秒に延長）
    console.log('カレンダーの読み込みを待機中...');
    await page.waitForSelector('td', { timeout: 30000 });

    console.log('カレンダーのtd要素を検出しました');

    // さらに少し待つ（カレンダーの完全な読み込みを待つ）
    await new Promise(resolve => setTimeout(resolve, 3000));

    // カレンダーのすべてのセルを取得して対象日付を探す
    console.log('カレンダーを解析中...');
    const status = await page.evaluate((targetDate) => {
      const cells = document.querySelectorAll('td');

      for (let cell of cells) {
        const dateText = cell.textContent.trim();

        if (dateText == targetDate) {
          // 対象日付のセルを見つけた
          console.log('対象日付のセルを発見:', dateText);

          if (cell.classList.contains('select-cell-available')) {
            // 予約可能
            return '空きあり';
          } else if (cell.classList.contains('day-closed')) {
            // 休診日
            return '「満」';
          } else if (cell.classList.contains('day-full')) {
            // 予約満員
            return '「満」';
          }
        }
      }

      // 対象日付のセルが見つからなかった場合
      return '満';
    }, targetDate);

    console.log(`判定結果: ${displayText}分 → ${status}`);

    // Googleスプレッドシートに記録
    await saveToSpreadsheet(status);

    console.log('スプレッドシートへの記録完了');
    console.log('=== 予約状況チェック完了 ===\n');

    return { success: true, status, displayText };

  } catch (error) {
    console.error('エラーが発生しました:', error.message);
    console.error('スタックトレース:', error.stack);

    // エラーはログに記録するのみ（次回リトライ）
    return { success: false, error: error.message };

  } finally {
    // ブラウザを閉じる
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Googleスプレッドシートに保存する関数
 * chrome-extension/content.js の saveToSpreadsheet() を移植
 */
async function saveToSpreadsheet(status) {
  if (!GOOGLE_APPS_SCRIPT_URL) {
    throw new Error('GOOGLE_APPS_SCRIPT_URL が設定されていません');
  }

  const timestamp = new Date().toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const data = {
    timestamp: timestamp,
    status: status
  };

  console.log('スプレッドシートに記録中...', data);

  // Google Apps ScriptのWeb AppにPOSTリクエストを送信
  const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`スプレッドシートへの記録に失敗: ${response.status}`);
  }

  return response;
}

/**
 * Cloud Scheduler からの HTTP リクエストを受け取るエンドポイント
 */
app.get('/check', async (req, res) => {
  console.log('Cloud Scheduler からのリクエストを受信しました');

  try {
    const result = await checkReservationStatus();

    if (result.skipped) {
      res.status(200).json({
        success: true,
        message: '月末のためスキップしました',
        reason: result.reason
      });
    } else if (result.success) {
      res.status(200).json({
        success: true,
        message: '予約状況のチェックが完了しました',
        status: result.status,
        displayText: result.displayText
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'エラーが発生しました',
        error: result.error
      });
    }
  } catch (error) {
    console.error('予期しないエラー:', error);
    res.status(500).json({
      success: false,
      message: '予期しないエラーが発生しました',
      error: error.message
    });
  }
});

/**
 * ヘルスチェック用エンドポイント
 */
app.get('/', (req, res) => {
  res.status(200).json({
    service: '予約状況自動チェックシステム',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      check: '/check - 予約状況をチェック',
      health: '/ - ヘルスチェック'
    }
  });
});

/**
 * テスト用エンドポイント（手動実行）
 */
app.get('/test', async (req, res) => {
  console.log('テストモードで実行します');

  try {
    const result = await checkReservationStatus();
    res.status(200).json({
      success: true,
      message: 'テスト実行完了',
      result: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log('==============================================');
  console.log('予約状況自動チェックシステム 起動しました');
  console.log(`ポート: ${PORT}`);
  console.log(`予約ページ: ${RESERVATION_URL}`);
  console.log(`GAS URL: ${GOOGLE_APPS_SCRIPT_URL ? '設定済み' : '未設定'}`);
  console.log('==============================================\n');
});
