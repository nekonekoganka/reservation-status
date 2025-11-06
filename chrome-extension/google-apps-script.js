/**
 * Google Apps Script - スプレッドシートに書き込むWeb App
 * 
 * このコードをGoogle Apps Scriptエディタにコピーして使用します
 */

// スプレッドシートのID
const SPREADSHEET_ID = '1XRi1YeaMX0DtH-3WbK8jV_EbeGiIHi37kmXvFTGZo1A';
const SHEET_NAME = 'フォームの回答 1';

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
    
    // 新しい行を追加
    sheet.appendRow([timestamp, status]);
    
    // 成功レスポンス
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: '記録しました'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // エラーレスポンス
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GETリクエストを受け取る関数（テスト用）
 */
function doGet(e) {
  return ContentService.createTextOutput('予約状況自動更新システムが動作しています');
}
