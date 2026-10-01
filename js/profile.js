/* 《順路眼》個人中心（profile.html 專用） */

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireLogin()) return;
    updateHeaderAvatar();
    await refreshUserFromDB();

    document.getElementById('profile-name').innerText = currentUser.nickname || '使用者';
    updateProfileAvatarDisplay();
    renderReviews();

    // 還原定位追蹤開關狀態
    document.getElementById('toggle-gps-tracking').checked = isTrackingEnabled();
});

function updateProfileAvatarDisplay() {
    const pa = document.getElementById('profile-avatar');
    if (!pa) return;
    pa.innerHTML = (currentUser && currentUser.avatar)
        ? `<img src="${escapeHTML(currentUser.avatar)}" alt="頭像">`
        : '<span>👤</span>';
}

// --- 頭像更換 ---
function triggerProfileAvatarPicker() {
    document.getElementById('profile-avatar-input').click();
}

function handleChangeAvatar(e) {
    const fr = new FileReader();
    fr.onload = async (ev) => {
        const img = ev.target.result;
        try {
            await db.collection('users').doc(currentUser.email).update({ avatar: img });
            currentUser.avatar = img;
            saveCurrentUser();
            updateProfileAvatarDisplay();
            updateHeaderAvatar();
            alert('頭像更新成功！');
        } catch (err) {
            alert('更新失敗：' + err.message);
        }
    };
    fr.onerror = () => {
        alert('❌ 圖片讀取失敗，請重新選擇檔案');
    };
    if (e.target.files[0]) fr.readAsDataURL(e.target.files[0]);
}

// --- 修改密碼 ---
async function handleChangePassword() {
    const op = document.getElementById('change-old-pass').value;
    const np = document.getElementById('change-new-pass').value;
    if (!np) return alert('請輸入新密碼！');

    if (currentUser && op === currentUser.pass) {
        try {
            await db.collection('users').doc(currentUser.email).update({ pass: np });
            currentUser.pass = np;
            saveCurrentUser();
            document.getElementById('change-old-pass').value = '';
            document.getElementById('change-new-pass').value = '';
            alert('密碼修改成功！');
        } catch (err) {
            alert('修改失敗：' + err.message);
        }
    } else {
        alert('舊密碼錯誤');
    }
}

// --- 隱私開關（存到 localStorage，地圖頁讀取） ---
function handlePrivacyChange() {
    const on = document.getElementById('toggle-gps-tracking').checked;
    localStorage.setItem('gpsTracking', on ? 'on' : 'off');
}

// --- 歷史評價 ---
function renderReviews() {
    const listEl = document.getElementById('review-list');
    const rvs = (currentUser && currentUser.reviews) || [];
    listEl.innerHTML = rvs.map(r => `
        <div class="review-card">
            <div style="display:flex; justify-content:space-between;">
                <b>${r.stars}</b>
                <small style="color:#999;">${r.date}</small>
            </div>
            <p style="margin:5px 0; font-size:0.9rem;">${escapeHTML(r.comment)}</p>
            <small style="color:var(--primary-color);">來自：${escapeHTML(r.from || '匿名')}</small>
        </div>`).join('') || "<p class='no-data-msg'>目前尚無評價</p>";
}

// --- 摺疊面板 ---
function toggleAccordion(headerElement) {
    const content = headerElement.nextElementSibling;
    const arrow = headerElement.querySelector('.accordion-arrow');
    if (!content) return;

    const willOpen = getComputedStyle(content).display === 'none';
    // 先全部收合
    document.querySelectorAll('.accordion-content').forEach(item => item.style.display = 'none');
    document.querySelectorAll('.accordion-arrow').forEach(arr => arr.style.transform = 'rotate(0deg)');

    if (willOpen) {
        content.style.display = 'block';
        if (arrow) arrow.style.transform = 'rotate(180deg)';
    }
}
