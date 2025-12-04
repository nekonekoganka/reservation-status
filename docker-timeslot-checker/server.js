/**
 * 予約時間枠表示システム（Docker版）
 *
 * 予約ページから具体的な空き時間枠を取得し、Cloud Storageに保存
 * Cloud Scheduler + Cloud Run で1分ごとに自動実行
 */

require('dotenv').config();
const express = require('express');
const puppeteer = require('puppeteer');
const { Storage } = require('@google-cloud/storage');

const app = express();
const PORT = process.env.PORT || 8080;

// 環境変数から設定を取得
const RESERVATION_URL = process.env.RESERVATION_URL || 'https://ckreserve.com/clinic/fujiminohikari-ganka/fujimino';
const BUCKET_NAME = process.env.BUCKET_NAME || 'reservation-timeslots-fujiminohikari';
const FILE_NAME = 'timeslots.json';

// タイムゾーンを Asia/Tokyo に設定
process.env.TZ = 'Asia/Tokyo';

// Cloud Storage クライアントを初期化
const storage = new Storage();
const bucket = storage.bucket(BUCKET_NAME);
const file = bucket.file(FILE_NAME);

/**
 * チェックする日付を計算する関数
 *
 * @returns {Object} {targetDate: number|null, displayText: string}
 */
function calculateTargetDate() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=日, 1=月, 2=火, 3=水, 4=木, 5=金, 6=土
  const hour = now.getHours();
  const minute = now.getMinutes();

  // 診療時間内かチェック（10:30-18:30）
  const isDuringClinicHours = (hour > 10 || (hour === 10 && minute >= 30)) && (hour < 18 || (hour === 18 && minute < 30));

  let daysToAdd = 0;
  let displayText = '本日';

  if (!isDuringClinicHours) {
    // 診療時間外の処理（18:30以降または10:30より前）

    // 月末チェック
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    if (now.getDate() === lastDayOfMonth && (hour >= 18 && minute >= 30)) {
      // 月末の18:30以降は自動判定しない
      console.log('月末18:30以降のため、自動判定をスキップします');
      return { targetDate: null, displayText: '次の診療日' };
    }

    // 火曜日（dayOfWeek === 2）の18:30以降
    if (dayOfWeek === 2 && hour >= 18 && minute >= 30) {
      daysToAdd = 2; // 木曜日をチェック
      displayText = '木曜';
    } else if (hour >= 18 && minute >= 30) {
      daysToAdd = 1; // 明日をチェック
      displayText = '次の診療日';
    } else {
      // 10:30より前
      daysToAdd = 0; // 本日をチェック
      displayText = '本日';
    }
  } else {
    // 診療時間内（10:30-18:30）の処理

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

const CALENDAR_CELL_SELECTOR = 'td.select-cell-available, td.day-closed, td.day-full';

/**
 * 予約カレンダーが存在する Frame/Page を待機して返す
 *
 * @param {import('puppeteer').Page} page
 * @param {number} timeoutMs
 * @returns {Promise<import('puppeteer').Frame|null>}
 */
async function waitForCalendarContext(page, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const mainFrameHasCalendar = await page.evaluate((selector) => {
        return document.querySelector(selector) !== null;
      }, CALENDAR_CELL_SELECTOR);

      if (mainFrameHasCalendar) {
        return page.mainFrame();
      }
    } catch (error) {
      console.log('メインページ判定中にエラーが発生しました:', error.message);
    }

    for (const frame of page.frames()) {
      try {
        const hasCalendar = await frame.evaluate((selector) => {
          return document.querySelector(selector) !== null;
        }, CALENDAR_CELL_SELECTOR);

        if (hasCalendar) {
          return frame;
        }
      } catch (error) {
        // クロスオリジン iframe などアクセスできない frame は無視
        console.log('frame へのアクセスをスキップ:', frame.url(), error.message);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return null;
}

/**
 * Puppeteerで予約ページから時間枠をチェックする関数
 */
async function checkTimeslots() {
  console.log('=== 予約時間枠チェック開始 ===');
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

    // 1. 初回アクセス（loadイベントまで待機）
    console.log('予約ページにアクセス中（初回）...');
    await page.goto(RESERVATION_URL, {
      waitUntil: 'load',
      timeout: 60000
    });
    console.log('初回読み込み完了（load）');

    // 2. 2秒待機
    console.log('2秒待機中...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('2秒待機完了');

    // 3. ページをリロード
    console.log('ページをリロード中...');
    await page.reload({
      waitUntil: 'load',
      timeout: 60000
    });
    console.log('リロード完了（load）');

    // 4. カレンダー読み込み待機（2秒）
    console.log('カレンダー読み込み待機中（2秒）...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('2秒待機完了');

    // 5. カレンダー完全読み込み待機（7秒）
    console.log('カレンダー完全読み込み待機中（7秒）...');
    await new Promise(resolve => setTimeout(resolve, 7000));
    console.log('7秒待機完了');

    console.log('Chrome拡張機能と同じタイミング完了（合計11秒待機）');

    // カレンダー（メインページまたは iframe）を探索
    console.log('カレンダー要素を探索中...');

    const calendarFrame = await waitForCalendarContext(page);

    // td要素が見つからない場合はデバッグ情報を出力
    if (!calendarFrame) {
      console.error('=== デバッグ情報 ===');

      const title = await page.title();
      const url = page.url();
      console.log('ページタイトル:', title);
      console.log('現在のURL:', url);

      const iframes = await page.evaluate(() => {
        const frames = document.querySelectorAll('iframe');
        return Array.from(frames).map(f => ({
          src: f.src,
          id: f.id,
          name: f.name
        }));
      });
      console.log('iframe の数:', iframes.length);
      if (iframes.length > 0) {
        console.log('iframe 情報:', JSON.stringify(iframes, null, 2));
      }

      console.log('===================');

      throw new Error('カレンダー要素が見つかりません');
    }

    const frameType = calendarFrame === page.mainFrame() ? 'メインページ' : 'iframe';
    console.log(`カレンダーのtd要素を検出しました (${frameType})`);
    console.log('使用する frame URL:', calendarFrame.url());

    // 対象日付のセルをクリック
    console.log(`対象日付 ${targetDate}日 のセルをクリックします...`);

    const clickResult = await calendarFrame.evaluate((targetDate) => {
      const cells = document.querySelectorAll('td');

      for (let cell of cells) {
        const dateText = cell.textContent.trim();

        if (dateText == targetDate) {
          // 対象日付のセルを見つけた
          console.log('対象日付のセルを発見:', dateText);

          // クリック可能かチェック
          if (cell.classList.contains('select-cell-available')) {
            cell.click();
            return { success: true, status: 'available' };
          } else if (cell.classList.contains('day-closed')) {
            return { success: false, status: 'closed', message: '休診日です' };
          } else if (cell.classList.contains('day-full')) {
            return { success: false, status: 'full', message: '満枠です' };
          }
        }
      }

      return { success: false, status: 'not-found', message: '対象日付が見つかりません' };
    }, targetDate);

    if (!clickResult.success) {
      console.log(`日付クリック失敗: ${clickResult.message}`);

      // 満枠または休診日の場合は空配列を返す
      const timeslotsData = {
        date: targetDate,
        displayText: displayText,
        slots: [],
        status: clickResult.status,
        message: clickResult.message,
        updatedAt: new Date().toISOString()
      };

      await saveTimeslotsToCloudStorage(timeslotsData);

      return {
        success: true,
        displayText,
        slots: [],
        status: clickResult.status,
        message: clickResult.message
      };
    }

    console.log('日付をクリックしました。時間枠の読み込みを待機中...');

    // 時間枠の表示を待つ（最大10秒）
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 時間枠をスクレイピング
    console.log('時間枠を抽出中...');

    const timeslots = await calendarFrame.evaluate(() => {
      const slots = [];

      // .select-cell-available クラスを持つ要素を探す
      const availableCells = document.querySelectorAll('.select-cell-available');

      availableCells.forEach(cell => {
        // テキストから時間を抽出（例: "10:15\n○"）
        const text = cell.textContent.trim();
        const timeMatch = text.match(/\d{1,2}:\d{2}/);

        if (timeMatch) {
          slots.push(timeMatch[0]);
        }
      });

      return slots;
    });

    console.log(`抽出された時間枠: ${timeslots.length}件`);
    console.log('時間枠:', timeslots.join(', '));

    // Cloud Storageに保存
    const timeslotsData = {
      date: targetDate,
      displayText: displayText,
      slots: timeslots,
      status: timeslots.length > 0 ? 'available' : 'full',
      updatedAt: new Date().toISOString()
    };

    await saveTimeslotsToCloudStorage(timeslotsData);

    console.log('Cloud Storageへの保存完了');
    console.log('=== 予約時間枠チェック完了 ===\n');

    return { success: true, displayText, slots: timeslots };

  } catch (error) {
    console.error('エラーが発生しました:', error.message);
    console.error('スタックトレース:', error.stack);

    // エラー時は空配列を返す
    const timeslotsData = {
      date: null,
      displayText: '本日',
      slots: [],
      status: 'error',
      error: error.message,
      updatedAt: new Date().toISOString()
    };

    await saveTimeslotsToCloudStorage(timeslotsData);

    return { success: false, error: error.message };

  } finally {
    // ブラウザを閉じる
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * 時間枠データをCloud Storageに保存する関数
 */
async function saveTimeslotsToCloudStorage(data) {
  try {
    const jsonString = JSON.stringify(data, null, 2);

    // Cloud Storageにアップロード
    await file.save(jsonString, {
      contentType: 'application/json',
      metadata: {
        cacheControl: 'public, max-age=60',
      },
    });

    // ファイルを公開アクセス可能にする
    await file.makePublic();

    console.log(`Cloud Storageに保存しました: gs://${BUCKET_NAME}/${FILE_NAME}`);
    console.log(`公開URL: https://storage.googleapis.com/${BUCKET_NAME}/${FILE_NAME}`);
  } catch (error) {
    console.error('Cloud Storageへの保存に失敗しました:', error.message);
    throw error;
  }
}

/**
 * Cloud Schedulerからのリクエストを受け取るエンドポイント
 */
app.get('/check', async (req, res) => {
  console.log('Cloud Scheduler からのリクエストを受信しました');

  try {
    const result = await checkTimeslots();

    if (result.skipped) {
      res.status(200).json({
        success: true,
        message: '月末のためスキップしました',
        reason: result.reason
      });
    } else if (result.success) {
      res.status(200).json({
        success: true,
        message: '予約時間枠のチェックが完了しました',
        displayText: result.displayText,
        slots: result.slots || [],
        slotsCount: (result.slots || []).length
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
    service: '予約時間枠表示システム',
    status: 'running',
    version: '1.0.0',
    bucketName: BUCKET_NAME,
    publicUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${FILE_NAME}`,
    endpoints: {
      check: '/check - 予約時間枠をチェック',
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
    const result = await checkTimeslots();
    res.status(200).json({
      success: true,
      message: 'テスト実行完了',
      result: result,
      publicUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${FILE_NAME}`
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
  console.log('予約時間枠表示システム 起動しました');
  console.log(`ポート: ${PORT}`);
  console.log(`予約ページ: ${RESERVATION_URL}`);
  console.log(`Cloud Storage バケット: ${BUCKET_NAME}`);
  console.log(`公開URL: https://storage.googleapis.com/${BUCKET_NAME}/${FILE_NAME}`);
  console.log('==============================================\n');
});
