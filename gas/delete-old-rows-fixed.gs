/**
 * Google Apps Script - 古い行を自動削除
 * 
 * 機能：
 * - スプレッドシートが20,000行を超えたら、古い行を削除
 * - 毎週水曜日 午前3時に自動実行（トリガー設定が必要）
 * 
 * 注意：このコードは既存のGASと同じファイルに追加する場合に使用
 * SPREADSHEET_IDとSHEET_NAMEは既存の定数を使用します
 */

// 保持する最大行数（ヘッダー含む）
const MAX_ROWS = 20000;

/**
 * 古い行を削除する関数
 */
function deleteOldRows() {
  try {
    // スプレッドシートを開く（既存の定数を使用）
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      Logger.log('エラー: シートが見つかりません: ' + SHEET_NAME);
      return;
    }
    
    // 現在の行数を取得
    const lastRow = sheet.getLastRow();
    
    Logger.log('現在の行数: ' + lastRow);
    
    // MAX_ROWS以下の場合は何もしない
    if (lastRow <= MAX_ROWS) {
      Logger.log('行数が上限以下のため、削除不要です');
      return;
    }
    
    // 削除する行数を計算
    const rowsToDelete = lastRow - MAX_ROWS;
    
    Logger.log('削除する行数: ' + rowsToDelete);
    
    // 古い行を削除（2行目から削除、ヘッダーは残す）
    sheet.deleteRows(2, rowsToDelete);
    
    Logger.log('削除完了: ' + rowsToDelete + '行を削除しました');
    Logger.log('残り行数: ' + sheet.getLastRow());
    
  } catch (error) {
    Logger.log('エラーが発生しました: ' + error.toString());
  }
}

/**
 * テスト用関数（手動実行用）
 */
function testDeleteOldRows() {
  Logger.log('=== 古い行削除テスト開始 ===');
  deleteOldRows();
  Logger.log('=== テスト終了 ===');
}
