/**
 * ポップアップのロジック
 */

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', () => {
  loadStatus();
});

/**
 * storageから状態を取得して表示
 */
async function loadStatus() {
  try {
    const data = await chrome.storage.local.get([
      'generalStatus',
      'shiyaStatus',
      'lastUpdate',
      'error',
      'errorMessage'
    ]);

    // ローディングを非表示
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';

    // エラーチェック
    if (data.error) {
      document.getElementById('error').style.display = 'block';
      return;
    }

    // 一般予約の状態を表示
    if (data.generalStatus) {
      updateStatusDisplay(
        'general',
        data.generalStatus.isAvailable,
        data.generalStatus.dayText
      );
    }

    // 視野予約の状態を表示
    if (data.shiyaStatus) {
      updateStatusDisplay(
        'shiya',
        data.shiyaStatus.isAvailable,
        data.shiyaStatus.dayText
      );
    }

    // 更新時刻を表示
    if (data.lastUpdate) {
      const updateTime = formatTimestamp(data.lastUpdate);
      document.getElementById('updateTime').textContent = `更新: ${updateTime}`;
    }

  } catch (error) {
    console.error('ポップアップエラー:', error);
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';
    document.getElementById('error').style.display = 'block';
  }
}

/**
 * 状態表示を更新
 */
function updateStatusDisplay(type, isAvailable, dayText) {
  const icon = document.getElementById(`${type}Icon`);
  const text = document.getElementById(`${type}Text`);

  const dayPrefix = dayText ? `${dayText} ` : '';

  if (isAvailable) {
    // 空きあり
    icon.textContent = '⭕';
    text.textContent = `${dayPrefix}空き`;
    text.className = 'status-text available';
  } else {
    // 満枠
    icon.textContent = '😔';
    text.textContent = `${dayPrefix}満枠`;
    text.className = 'status-text full';
  }
}

/**
 * タイムスタンプをフォーマット
 */
function formatTimestamp(timestampStr) {
  const date = new Date(timestampStr);

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${month}/${day} ${hours}:${minutes}`;
}
