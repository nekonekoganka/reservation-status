# 予約状況自動更新ブックマークレット（v7 - アラート削除版）

## 📱 スマホ・PC両対応

---

## 🚀 ブックマークレットのコード（最新版v7）

以下のコードを**そのまま全部コピー**して、ブックマークのURLとして保存してください：

```javascript
javascript:(function(){const GOOGLE_APPS_SCRIPT_URL='https://script.google.com/macros/s/AKfycbzIRL1XS4zVAwcAs8OKMhVDR-eC_amv2GPMW5-Y8dYr_UsA92-CZIAwKJvSyxWsAEDz/exec';function calculateTargetDate(){const now=new Date();const dayOfWeek=now.getDay();const hour=now.getHours();const minute=now.getMinutes();const isAfter1830=(hour>18)||(hour===18&&minute>=30);let daysToAdd=0;let displayText='本日';if(isAfter1830){const lastDayOfMonth=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();if(now.getDate()===lastDayOfMonth){return{targetDate:null,displayText:'翌営業日'};}if(dayOfWeek===2){daysToAdd=2;displayText='木曜';}else{daysToAdd=1;displayText='明日';}}else{if(dayOfWeek===3){daysToAdd=1;displayText='木曜';}else{daysToAdd=0;displayText='本日';}}const targetDate=new Date(now);targetDate.setDate(targetDate.getDate()+daysToAdd);return{targetDate:targetDate.getDate(),displayText:displayText};}async function checkAndSave(){const result=calculateTargetDate();const targetDate=result.targetDate;const displayText=result.displayText;if(targetDate===null){console.log('月末のため自動判定をスキップしました。フォームから入力してください。');return;}const cells=document.querySelectorAll('td');let status='満';for(let cell of cells){const dateText=cell.textContent.trim();if(dateText==targetDate){if(cell.classList.contains('select-cell-available')){status='空きあり';break;}else if(cell.classList.contains('day-closed')||cell.classList.contains('day-full')){status='「満」';break;}}}const timestamp=new Date().toLocaleString('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'});const data={timestamp:timestamp,status:status};try{await fetch(GOOGLE_APPS_SCRIPT_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});alert('✅ 更新完了！\n'+displayText+'分の状態: '+status);}catch(error){alert('❌ エラーが発生しました');}}checkAndSave();})();
```

---

## 📝 更新内容（v7）

### 変更点

1. **月末18:30以降** → アラートを表示せず、静かに終了
2. **コンソールに記録** → 「月末のため自動判定をスキップしました」とログ出力（デバッグ用）
3. **その他の動作** → v6と同じ

---

## 🔄 更新方法

### すでにブックマークレットを設定している場合

1. ブックマーク一覧から「🔄予約更新」を探す
2. 編集
3. URLを上記のコードに置き換え
4. 保存

---

## 🧪 動作

### 通常時（月末以外）
1. 予約ページを開く
2. ブックマークレットをタップ
3. 「✅ 更新完了！◯◯分の状態: 空きあり」と表示

### 月末18:30以降
1. 予約ページを開く
2. ブックマークレットをタップ
3. **何も表示されない**（静かに終了）
4. コンソール（F12キー）に「月末のため...」とログ表示

---

## 💡 運用

**月末18:30以降は、Googleフォームから手動入力してください。**

ブックマークレットは実行しても何も起こりませんが、エラーではありません。
