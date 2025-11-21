// 予約状況自動更新ボタンを追加するプログラム

// スプレッドシートの設定
const SPREADSHEET_ID = '1RSd9aC5B_-gQ1_j5V1aQcZn1iVw9v8mpmhJ78_8gY80';
const SHEET_NAME = 'フォームの回答 1';

// Google Apps ScriptのWeb App URL
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzIRL1XS4zVAwcAs8OKMhVDR-eC_amv2GPMW5-Y8dYr_UsA92-CZIAwKJvSyxWsAEDz/exec';

// ページ読み込み完了後に実行
window.addEventListener('load', () => {
  // 少し待ってからボタンを追加（カレンダーの読み込みを待つ）
  setTimeout(() => {
    addUpdateButton();
    // 自動実行フラグをチェック
    checkAutoRun();
  }, 2000);
});

/**
 * 自動実行フラグをチェックする関数
 */
function checkAutoRun() {
  const autoCheck = localStorage.getItem('autoCheck');

  if (autoCheck === 'true') {
    // フラグをクリア
    localStorage.removeItem('autoCheck');

    const button = document.getElementById('reservation-update-button');
    if (button) {
      // ボタンを「待機中」表示に変更
      button.textContent = '⏳ カレンダー読み込み中...';
      button.disabled = true;
      button.style.opacity = '0.7';

      // 7秒待ってから自動チェック実行
      setTimeout(() => {
        checkReservationStatus();
      }, 7000);
    }
  }
}

/**
 * 更新ボタンを追加する関数
 */
function addUpdateButton() {
  // すでにボタンがあれば追加しない
  if (document.getElementById('reservation-update-button')) {
    return;
  }

  // ボタンを作成
  const button = document.createElement('button');
  button.id = 'reservation-update-button';
  button.textContent = '🔄 予約状況を更新する';
  button.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    z-index: 99999;
    padding: 20px 40px;
    font-size: 18px;
    font-weight: bold;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
    font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif;
  `;

  // ホバー効果
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.05)';
    button.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.4)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.3)';
  });

  // クリックイベント
  button.addEventListener('click', handleButtonClick);

  // ページに追加
  document.body.appendChild(button);
}

/**
 * ボタンクリック時の処理
 */
function handleButtonClick() {
  const button = document.getElementById('reservation-update-button');

  // ボタンを「リロード中」表示に変更
  button.textContent = '🔄 ページを更新中...';
  button.disabled = true;
  button.style.opacity = '0.7';

  // 自動実行フラグを保存
  localStorage.setItem('autoCheck', 'true');

  // ページをリロード
  setTimeout(() => {
    location.reload();
  }, 500);
}

/**
 * チェックする日付を計算する関数
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
 * 予約状況をチェックする関数
 */
async function checkReservationStatus() {
  const button = document.getElementById('reservation-update-button');
  
  // ボタンを「処理中」表示に変更
  button.textContent = '⏳ 確認中...';
  button.disabled = true;
  button.style.opacity = '0.7';

  try {
    // チェックする日付を計算
    const { targetDate, displayText } = calculateTargetDate();
    
    // 月末の18:30以降は自動判定しない
    if (targetDate === null) {
      button.textContent = '⚠️ 月末です フォームから入力してね';
      button.style.background = 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)';
      
      // 7秒後に元に戻す
      setTimeout(() => {
        button.textContent = '🔄 予約状況を更新する';
        button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        button.disabled = false;
        button.style.opacity = '1';
      }, 7000);
      
      return;
    }

    // カレンダーのすべてのセルを取得
    const cells = document.querySelectorAll('td');
    
    let status = '満'; // デフォルトは「満」

    // 対象日付のセルを探す
    for (let cell of cells) {
      const dateText = cell.textContent.trim();
      
      if (dateText == targetDate) {
        // 対象日付のセルを見つけた
        
        if (cell.classList.contains('select-cell-available')) {
          // 予約可能
          status = '空きあり';
          break;
        } else if (cell.classList.contains('day-closed')) {
          // 休診日
          status = '「満」';
          break;
        } else if (cell.classList.contains('day-full')) {
          // 予約満員
          status = '「満」';
          break;
        }
      }
    }

    // Googleスプレッドシートに記録
    await saveToSpreadsheet(status);

    // 成功メッセージ
    button.textContent = `✅ ${displayText}分: ${status}`;
    button.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
    
    // 7秒後に元に戻す
    setTimeout(() => {
      button.textContent = '🔄 予約状況を更新する';
      button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      button.disabled = false;
      button.style.opacity = '1';
    }, 7000);

  } catch (error) {
    console.error('エラー:', error);
    
    // エラーメッセージ
    button.textContent = '❌ エラーが発生しました';
    button.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    
    // 7秒後に元に戻す
    setTimeout(() => {
      button.textContent = '🔄 予約状況を更新する';
      button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      button.disabled = false;
      button.style.opacity = '1';
    }, 7000);
  }
}

/**
 * Googleスプレッドシートに保存する関数
 */
async function saveToSpreadsheet(status) {
  // Google Apps Script経由でスプレッドシートに書き込む
  
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

  // Google Apps ScriptのWeb AppにPOSTリクエストを送信
  const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });

  return response;
}
