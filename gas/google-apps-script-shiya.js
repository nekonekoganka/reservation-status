/**
 * Google Apps Script - 視野予約用スプレッドシートに書き込むWeb App
 *
 * このコードをGoogle Apps Scriptエディタにコピーして使用します
 * デプロイ後、Web App URLを docker-automation-shiya/ で使用します
 */

// スプレッドシートのID（一般予約と同じスプレッドシート）
const SPREADSHEET_ID = '1RSd9aC5B_-gQ1_j5V1aQcZn1iVw9v8mpmhJ78_8gY80';

// 視野予約用のシート名
const SHEET_NAME = 'フォームの回答_視野予約';

/**
 * POSTリクエストを受け取る関数
 */
function doPost(e) {
  try {
    // リクエストボディからデータを取得
    const data = JSON.parse(e.postData.contents);

    const timestamp = data.timestamp;
    const status = data.status;

    // スプレッドシートを開く
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);

    // シートが存在しない場合はエラー
    if (!sheet) {
      throw new Error(`シート「${SHEET_NAME}」が見つかりません。スプレッドシートにシートを作成してください。`);
    }

    // 新しい行を追加
    sheet.appendRow([timestamp, status]);

    // 成功レスポンス
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: '視野予約の記録が完了しました',
      sheet: SHEET_NAME,
      timestamp: timestamp,
      status: status
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // エラーレスポンス
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString(),
      sheet: SHEET_NAME
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GETリクエストを受け取る関数（テスト用）
 */
function doGet(e) {
  return ContentService.createTextOutput(
    '視野予約状況自動更新システムが動作しています (視野予約専用)'
  );
}
