/**
 * Display Auto Reloader - Content Script
 *
 * display.htmlとdisplay-shiya.htmlのページ内で動作し、
 * background.jsからのリロード指示を受けてページをリロードします
 */

// Service Workerからのメッセージをリスニング
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // リロード指示を受信
  if (message.action === 'reload') {
    console.log('Display Auto Reloader: リロード指示を受信しました');

    // ページをリロード
    location.reload();

    // 応答を送信（オプション）
    sendResponse({ success: true });
  }

  // 非同期処理の場合はtrueを返す必要がある
  return true;
});

// Content Script読み込み時のログ
console.log('Display Auto Reloader: Content Script が読み込まれました');
console.log('Display Auto Reloader: 1分ごとに自動更新されます');
