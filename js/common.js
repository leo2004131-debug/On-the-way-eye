/* 《順路眼》共用邏輯：登入狀態、導覽、工具函式 */

let currentUser = null;

function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag]));
}

/* 登入狀態存於 sessionStorage：同一瀏覽器工作階段內換頁免重登，
   關閉瀏覽器後失效，重開 index 一律回到登入頁 */
function loadCurrentUser() {
    localStorage.removeItem('currentUser'); // 清掉舊版殘留的永久登入紀錄
    const saved = sessionStorage.getItem('currentUser');
    if (saved) {
        try { currentUser = JSON.parse(saved); } catch (e) { currentUser = null; }
    }
    return currentUser;
}

/* 受保護頁面開頭呼叫：未登入一律踢回登入頁 */
function requireLogin() {
    if (!loadCurrentUser()) {
        location.replace('index.html');
        return null;
    }
    return currentUser;
}

function saveCurrentUser() {
    const { pass, ...safeUser } = currentUser;
    sessionStorage.setItem('currentUser', JSON.stringify(safeUser));
}

/* 換頁後從 Firestore 重新同步餘額與頭像，避免本機快取過期 */
async function refreshUserFromDB() {
    if (!currentUser) return;
    try {
        const doc = await db.collection('users').doc(currentUser.email).get();
        if (doc.exists) {
            currentUser = { email: currentUser.email, ...doc.data() };
            saveCurrentUser();
        }
    } catch (err) {
        console.warn('同步使用者資料失敗（使用本機快取）:', err);
    }
}

function handleLogout() {
    if (confirm('確定要登出嗎？')) {
        sessionStorage.removeItem('currentUser');
        location.href = 'index.html';
    }
}

/* 交易紀錄統一寫入：ts 為數字時間戳，修正原本用中文時間字串排序錯亂的 bug */
function addTransaction(type, amount, item) {
    return db.collection('users').doc(currentUser.email)
        .collection('transactions').add({
            type: type,
            amount: amount,
            item: item || '',
            time: getTimeStr(),
            ts: firebase.firestore.FieldValue.serverTimestamp()
        });
}

function getTimeStr() {
    return new Date().toLocaleString('zh-TW', {
        month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: true
    });
}

/* 定位追蹤隱私開關（個人中心設定，地圖頁讀取） */
function isTrackingEnabled() {
    return localStorage.getItem('gpsTracking') !== 'off';
}

/* 左上角頭像快捷鍵 */
function updateHeaderAvatar() {
    const el = document.getElementById('top-left-avatar-btn');
    if (!el || !currentUser) return;
    el.innerHTML = currentUser.avatar
        ? `<img src="${escapeHTML(currentUser.avatar)}" alt="頭像">`
        : '<span>👤</span>';
}
