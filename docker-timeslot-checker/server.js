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
 * 年末年始休業期間かどうかを判定する関数
 * @param {Date} date - 判定する日付
 * @returns {boolean} 年末年始休業期間の場合true
 */
function isNewYearHoliday(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // 12/31 〜 1/3
  return (month === 12 && day === 31) || (month === 1 && day <= 3);
}

/**
 * 日本時間を取得する関数（タイムゾーン設定に依存しない）
 * UTCから+9時間のオフセットで計算する堅牢な方法
 * @returns {Object} {year, month, date, dayOfWeek, hour, minute}
 */
function getJapanTime() {
  const now = new Date();

  // 日本時間はUTC+9時間
  const japanOffset = 9 * 60 * 60 * 1000; // 9時間をミリ秒に変換
  const japanTime = new Date(now.getTime() + japanOffset);

  // UTCメソッドを使って日本時間の各値を取得
  const year = japanTime.getUTCFullYear();
  const month = japanTime.getUTCMonth() + 1; // 1-indexed (1-12)
  const date = japanTime.getUTCDate();
  const dayOfWeek = japanTime.getUTCDay();
  const hour = japanTime.getUTCHours();
  const minute = japanTime.getUTCMinutes();

  console.log(`日本時間: ${year}/${month}/${date} ${hour}:${minute} (曜日: ${dayOfWeek})`);

  return { year, month, date, dayOfWeek, hour, minute };
}

/**
 * チェックする日付を計算する関数
 *
 * @returns {Object} {targetDate: number, targetMonth: number, needsNextMonthClick: boolean, displayText: string}
 */
function calculateTargetDate() {
  // 日本時間を明示的に取得（環境のタイムゾーン設定に依存しない）
  const japanTime = getJapanTime();
  const dayOfWeek = japanTime.dayOfWeek; // 0=日, 1=月, 2=火, 3=水, 4=木, 5=金, 6=土
  const hour = japanTime.hour;
  const minute = japanTime.minute;

  // 18:30以降かチェック
  const isAfter1830 = (hour > 18) || (hour === 18 && minute >= 30);

  // 日本時間ベースでDateオブジェクトを作成
  let targetDate = new Date(japanTime.year, japanTime.month - 1, japanTime.date);
  let displayText = '本日';
  let needsNextMonthClick = false;

  if (isAfter1830) {
    // 18:30以降の処理

    // 月末チェック
    const lastDayOfMonth = new Date(japanTime.year, japanTime.month, 0).getDate();
    const isEndOfMonth = (japanTime.date === lastDayOfMonth);

    if (isEndOfMonth) {
      // 翌月1日に設定
      targetDate.setMonth(targetDate.getMonth() + 1);
      targetDate.setDate(1);
      displayText = '次の診療日';
      needsNextMonthClick = true; // カレンダー切り替えフラグ

      console.log(`月末18:30以降のため、翌月${targetDate.getMonth() + 1}月に切り替えます`);
    } else {
      // 既存ロジック（火曜18:30以降→木曜、その他→明日）
      if (dayOfWeek === 2) {
        targetDate.setDate(targetDate.getDate() + 2);
        displayText = '木曜';
      } else {
        targetDate.setDate(targetDate.getDate() + 1);
        displayText = '明日';
      }
    }
  } else {
    // 18:30より前の処理

    // 水曜日（dayOfWeek === 3）
    if (dayOfWeek === 3) {
      targetDate.setDate(targetDate.getDate() + 1);
      displayText = '木曜';
    } else {
      // 本日をチェック
      displayText = '本日';
    }
  }

  // 年末年始チェック
  const originalMonth = targetDate.getMonth();
  while (isNewYearHoliday(targetDate)) {
    console.log(`${targetDate.getMonth() + 1}月${targetDate.getDate()}日は年末年始休業のため、翌日をチェック`);
    targetDate.setDate(targetDate.getDate() + 1);
    displayText = '営業再開日';

    // 月をまたぐ場合はフラグを立てる
    if (targetDate.getMonth() !== originalMonth) {
      needsNextMonthClick = true;
    }
  }

  // 水曜日（休診日）チェック
  if (targetDate.getDay() === 3) {
    console.log(`${targetDate.getMonth() + 1}月${targetDate.getDate()}日は水曜日（休診日）のため、翌日をチェック`);
    targetDate.setDate(targetDate.getDate() + 1);
    if (displayText === '営業再開日') {
      displayText = '営業再開日（木曜）';
    } else {
      displayText = '木曜';
    }

    // 月をまたぐ場合はフラグを立てる
    if (targetDate.getMonth() !== originalMonth) {
      needsNextMonthClick = true;
    }
  }

  console.log(`判定結果: ${targetDate.getMonth() + 1}月${targetDate.getDate()}日 (${displayText})`);

  return {
    targetDate: targetDate.getDate(),
    targetMonth: targetDate.getMonth() + 1,
    needsNextMonthClick,
    displayText
  };
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
    const { targetDate, targetMonth, needsNextMonthClick, displayText } = calculateTargetDate();

    console.log(`チェック対象: ${displayText}分 (${targetMonth}月${targetDate}日)`);

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

    // 月送りが必要な場合
    if (needsNextMonthClick) {
      console.log(`翌月（${targetMonth}月）のカレンダーに切り替えます`);

      // 次月ボタンを複数のセレクターで試行
      const selectors = [
        '.fa-caret-right',           // FontAwesomeアイコン
        'i.fa-caret-right',          // iタグのFontAwesomeアイコン
        'button .fa-caret-right',    // ボタン内のアイコン
        '[aria-label*="次"]',        // aria-label
        '[aria-label*="Next"]',
        '.calendar-next',
        'button[onclick*="next"]'
      ];

      let nextMonthButton = null;
      let usedSelector = null;

      // 複数のセレクターを試す
      for (const selector of selectors) {
        try {
          nextMonthButton = await calendarFrame.$(selector);
          if (nextMonthButton) {
            usedSelector = selector;
            console.log(`次月ボタンを発見: ${selector}`);
            break;
          }
        } catch (error) {
          console.log(`セレクター ${selector} で検索失敗:`, error.message);
        }
      }

      if (nextMonthButton) {
        await nextMonthButton.click();
        console.log(`次月ボタンをクリックしました (${usedSelector})`);

        // カレンダー再読み込み待機
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('翌月カレンダーに切り替え完了');
      } else {
        console.error('次月ボタンが見つかりません');
        console.error('利用可能なボタン要素:', await calendarFrame.evaluate(() => {
          const buttons = document.querySelectorAll('button, a, .fa-caret-right');
          return Array.from(buttons).slice(0, 10).map(b => ({
            tag: b.tagName,
            class: b.className,
            text: b.textContent?.substring(0, 50),
            onclick: b.getAttribute('onclick')?.substring(0, 50)
          }));
        }));
        throw new Error('カレンダーの月送りボタンが見つかりません');
      }
    }

    // 対象日付のセルをクリック
    console.log(`対象日付 ${targetMonth}月${targetDate}日 のセルをクリックします...`);

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
