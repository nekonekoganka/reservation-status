/**
 * Google Apps Script - 視野予約の古い行を自動削除
 *
 * 機能：
 * - 視野予約のスプレッドシートが20,000行を超えたら、古い行を削除
 * - 毎週水曜日 午前3時に自動実行（トリガー設定が必要）
 *
 * 設定方法：
 * 1. Google Apps Scriptエディタでこのコードを google-apps-script-shiya.js に追加
 * 2. トリガーを設定：
 *    - 関数: deleteOldRows_Shiya
 *    - イベントソース: 時間主導型
 *    - 時間ベースのトリガー: 週ベースのタイマー
 *    - 曜日: 水曜日
 *    - 時刻: 午前3時～4時
 */

// 保持する最大行数（ヘッダー含む）
const MAX_ROWS_SHIYA = 20000;

// スプレッドシートのID（視野予約と同じスプレッドシート）
const SPREADSHEET_ID_SHIYA = '1RSd9aC5B_-gQ1_j5V1aQcZn1iVw9v8mpmhJ78_8gY80';

// 視野予約用のシート名
const SHEET_NAME_SHIYA = 'フォームの回答_視野予約';

/**
 * 視野予約の古い行を削除する関数
 */
function deleteOldRows_Shiya() {
  try {
    // スプレッドシートを開く
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID_SHIYA);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME_SHIYA);

    if (!sheet) {
      Logger.log('エラー: シートが見つかりません: ' + SHEET_NAME_SHIYA);
      return;
    }

    // 現在の行数を取得
    const lastRow = sheet.getLastRow();

    Logger.log('【視野予約】現在の行数: ' + lastRow);

    // MAX_ROWS_SHIYA以下の場合は何もしない
    if (lastRow <= MAX_ROWS_SHIYA) {
      Logger.log('【視野予約】行数が上限以下のため、削除不要です');
      return;
    }

    // 削除する行数を計算
    const rowsToDelete = lastRow - MAX_ROWS_SHIYA;

    Logger.log('【視野予約】削除する行数: ' + rowsToDelete);

    // 古い行を削除（2行目から削除、ヘッダーは残す）
    sheet.deleteRows(2, rowsToDelete);

    Logger.log('【視野予約】削除完了: ' + rowsToDelete + '行を削除しました');
    Logger.log('【視野予約】残り行数: ' + sheet.getLastRow());

  } catch (error) {
    Logger.log('【視野予約】エラーが発生しました: ' + error.toString());
  }
}

/**
 * テスト用関数（手動実行用）
 */
function testDeleteOldRows_Shiya() {
  Logger.log('=== 【視野予約】古い行削除テスト開始 ===');
  deleteOldRows_Shiya();
  Logger.log('=== 【視野予約】テスト終了 ===');
}
