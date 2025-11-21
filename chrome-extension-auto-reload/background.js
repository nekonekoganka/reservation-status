/**
 * Display Auto Reloader - Background Service Worker
 *
 * display.html、display-shiya.html、display-combined.htmlを1分ごとに自動更新するChrome拡張機能
 *
 * 動作:
 * - 60秒ごとにアラームを発火
 * - 対象URLのタブを検索
 * - 該当タブにリロード指示を送信
 */

// 対象URL（複数）
const TARGET_URLS = [
  'https://nekonekoganka.github.io/reservation-status/display.html',
  'https://nekonekoganka.github.io/reservation-status/display-shiya.html',
  'https://nekonekoganka.github.io/reservation-status/display-combined.html'
];

// アラーム名
const ALARM_NAME = 'autoReloadAlarm';

// 更新間隔（分）
const RELOAD_INTERVAL_MINUTES = 1;

/**
 * 拡張機能インストール時の処理
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('Display Auto Reloader: インストールされました');

  // アラームを設定
  setupAlarm();
});

/**
 * Service Worker起動時の処理
 */
chrome.runtime.onStartup.addListener(() => {
  console.log('Display Auto Reloader: 起動しました');

  // アラームを設定
  setupAlarm();
});

/**
 * アラームを設定する関数
 */
function setupAlarm() {
  // 既存のアラームをクリア
  chrome.alarms.clear(ALARM_NAME, (wasCleared) => {
    if (wasCleared) {
      console.log('Display Auto Reloader: 既存のアラームをクリアしました');
    }

    // 新しいアラームを作成
    chrome.alarms.create(ALARM_NAME, {
      periodInMinutes: RELOAD_INTERVAL_MINUTES
    });

    console.log(`Display Auto Reloader: アラームを設定しました（${RELOAD_INTERVAL_MINUTES}分ごと）`);
  });
}

/**
 * アラーム発火時の処理
 */
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    console.log('Display Auto Reloader: アラーム発火 - リロードを実行します');
    reloadTargetTabs();
  }
});

/**
 * 対象URLのタブを検索してリロード指示を送信
 */
async function reloadTargetTabs() {
  try {
    // 複数の対象URLのタブを検索
    const allTabs = [];

    for (const url of TARGET_URLS) {
      const tabs = await chrome.tabs.query({ url: url });
      allTabs.push(...tabs);
    }

    if (allTabs.length === 0) {
      console.log('Display Auto Reloader: 対象URLのタブが見つかりませんでした');
      return;
    }

    console.log(`Display Auto Reloader: ${allTabs.length}個のタブを発見しました`);

    // 各タブにリロード指示を送信
    for (const tab of allTabs) {
      try {
        // Content Scriptにメッセージを送信
        await chrome.tabs.sendMessage(tab.id, { action: 'reload' });
        console.log(`Display Auto Reloader: タブID ${tab.id} (${tab.url}) にリロード指示を送信しました`);
      } catch (error) {
        // Content Scriptがまだ読み込まれていない場合など
        console.warn(`Display Auto Reloader: タブID ${tab.id} へのメッセージ送信に失敗しました:`, error.message);

        // フォールバック: chrome.tabs.reload() を使用
        try {
          await chrome.tabs.reload(tab.id);
          console.log(`Display Auto Reloader: タブID ${tab.id} を直接リロードしました（フォールバック）`);
        } catch (reloadError) {
          console.error(`Display Auto Reloader: タブID ${tab.id} のリロードに失敗しました:`, reloadError.message);
        }
      }
    }
  } catch (error) {
    console.error('Display Auto Reloader: エラーが発生しました:', error);
  }
}

// デバッグ用: アラームの状態を確認
chrome.alarms.getAll((alarms) => {
  console.log('Display Auto Reloader: 現在のアラーム:', alarms);
});
