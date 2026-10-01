/* 《順路眼》登入與註冊邏輯（index.html / register.html 共用） */

let userAvatarData = null;

document.addEventListener('DOMContentLoaded', () => {
    // 登入頁：已登入直接進入地圖大廳
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        if (loadCurrentUser()) {
            location.replace('map.html');
            return;
        }
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleLogin();
        });
    }

    // 註冊頁
    const regForm = document.getElementById('register-form');
    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleRegister();
        });
    }
});

async function handleLogin() {
    const u = document.getElementById('login-user').value.trim().toLowerCase();
    const p = document.getElementById('login-pass').value;
    const btn = document.querySelector('#login-form .login-main-btn');

    if (!u || !p) return alert('請輸入電子郵件與密碼！');

    btn.innerText = '⏳ 正在驗證...';
    btn.disabled = true;

    try {
        const doc = await db.collection('users').doc(u).get();
        if (doc.exists && doc.data().pass === p) {
            currentUser = { email: u, ...doc.data() };
            saveCurrentUser();
            location.href = 'map.html';
        } else {
            alert('❌ 登入失敗：帳號或密碼錯誤！\n(請確認 Email 是否完全正確)');
        }
    } catch (err) {
        console.error('Login Error:', err);
        alert('❌ 連線資料庫失敗，請稍後再試。');
    } finally {
        btn.innerText = '進入大廳';
        btn.disabled = false;
    }
}

/* 開發者登入：修正原版未建立資料庫文件，導致儲值/交易直接失敗的 bug */
async function handleDevLogin() {
    try {
        await db.collection('users').doc('dev').set({
            nickname: '開發者',
            pass: 'dev',
            balance: 9999,
            avatar: null,
            reviews: []
        }, { merge: true });
        const doc = await db.collection('users').doc('dev').get();
        currentUser = { email: 'dev', ...doc.data() };
    } catch (err) {
        console.warn('離線模式，使用本機開發者帳號:', err);
        currentUser = { email: 'dev', nickname: '開發者', pass: 'dev', balance: 9999, avatar: null, reviews: [] };
    }
    saveCurrentUser();
    location.href = 'map.html';
}

async function handleRegister() {
    const btn = document.querySelector('#register-form .reg-main-btn');
    const nick = document.getElementById('reg-nick').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const pass = document.getElementById('reg-pass').value;
    const confirmPass = document.getElementById('reg-confirm').value;

    if (!nick || !email || !pass) return alert('請填寫完整資訊！');
    if (pass !== confirmPass) return alert('兩次密碼輸入不一致！');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return alert('請輸入有效的電子郵件格式！');
    if (pass.length < 6) return alert('密碼至少需要 6 個字元！');

    // 防禦：Base64 頭像太大會讓 Firestore 文件超過上限
    let finalAvatar = userAvatarData;
    if (finalAvatar && finalAvatar.length > 800000) {
        const proceed = confirm('圖片檔案過大，可能會導致存取緩慢，是否仍要繼續？');
        if (!proceed) return;
    }

    btn.innerText = '⏳ 正在處理...';
    btn.disabled = true;

    try {
        const checkDoc = await db.collection('users').doc(email).get();
        if (checkDoc.exists) {
            alert('❌ 該 Email 已被註冊，請換一個或直接登入。');
            return;
        }

        await db.collection('users').doc(email).set({
            nickname: nick,
            pass: pass,
            balance: 500,
            avatar: finalAvatar || null,
            reviews: [],
            createdAt: new Date().toISOString()
        });
        alert('🎉 註冊成功！現在請使用新帳號登入。');
        location.href = 'index.html';
    } catch (err) {
        console.error('Register Error:', err);
        alert('❌ 註冊失敗：' + err.message);
    } finally {
        btn.innerText = '建立帳號';
        btn.disabled = false;
    }
}

function previewAvatar(e) {
    const fr = new FileReader();
    fr.onload = (ev) => {
        userAvatarData = ev.target.result;
        const ip = document.getElementById('avatar-img-preview');
        ip.src = userAvatarData;
        ip.style.display = 'block';
        document.getElementById('default-avatar-icon').style.display = 'none';
    };
    fr.onerror = () => {
        alert('❌ 圖片讀取失敗，請重新選擇檔案');
    };
    if (e.target.files[0]) fr.readAsDataURL(e.target.files[0]);
}
