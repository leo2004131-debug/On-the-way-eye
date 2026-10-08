/* 《順路眼》地圖大廳（map.html 專用） */

let map, userMarker = null;
let taskMarkers = [];
let currentGps = null;
let gpsWatchId = null;
let isGpsAutoResume = false;          // watchPosition 持續追蹤 ID（規格書步驟 5-4）
let selectedTask = null;
let activeTask = null;
let isPickingLocation = false;
let currentRole = 'recipient';

// 5 公里鄰近模式：開啟時只顯示／只能接半徑內的任務
let nearbyRadiusKm = 0; // 0=全部, 5, 10, 15
let nearbyOnly = false;
let nearbyCircle = null;
// --- 地圖初始化 ---
function initMap() {
    // 還原上次離開時的視角（避免切分頁回來時重複縮放）
    const saved = sessionStorage.getItem('mapView');
    let initCenter = [25.0080, 121.4940];
    let initZoom = 14;
    if (saved) {
        try {
            const v = JSON.parse(saved);
            initCenter = [v.lat, v.lng];
            initZoom = v.zoom;
        } catch (e) { /* ignore */ }
    }

    map = L.map('map', { zoomControl: false, attributionControl: false })
        .setView(initCenter, initZoom);

    // 持續記錄地圖視角
    map.on('moveend', () => {
        const c = map.getCenter();
        sessionStorage.setItem('mapView', JSON.stringify({ lat: c.lat, lng: c.lng, zoom: map.getZoom() }));
    });

    // 採用 Google Maps 圖資，解決 OSM 在本機測試時因 Referer 產生的 403 Forbidden 阻擋問題
    L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&hl=zh-TW&x={x}&y={y}&z={z}', {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        maxNativeZoom: 19,
        attribution: '&copy; Google Maps'
    }).addTo(map);

    // 等手機外殼排版完成後強制刷新尺寸
    setTimeout(() => map.invalidateSize(), 300);

    // 發案選位模式：點擊地圖取得座標
    map.on('click', (e) => {
        if (!isPickingLocation) return;
        document.getElementById('pub-lat').value = e.latlng.lat;
        document.getElementById('pub-lng').value = e.latlng.lng;
        document.getElementById('pub-loc-status').innerText = '✅ 位置已選定';
        isPickingLocation = false;
        document.getElementById('picker-hint').style.display = 'none';
        document.getElementById('publish-modal').style.display = 'flex';
    });

    // 搜尋：邊打字邊模糊查詢地標（防抖動 400ms），最多顯示 7 筆建議
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', () => {
        const kw = searchInput.value.trim();
        clearTimeout(searchDebounceTimer);
        if (kw.length < 2) {
            hideSuggestions();
            if (kw === '') filterAndRenderTasks('');
            return;
        }
        searchDebounceTimer = setTimeout(() => fetchSuggestions(kw), 400);
    });

    // Enter 仍可過濾地圖上的任務點
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') filterAndRenderTasks(searchInput.value.trim());
        if (e.key === 'Escape') hideSuggestions();
    });

    // 點擊搜尋框以外的地方收起建議清單
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) hideSuggestions();
    });
}

// --- 地標模糊查詢（Nominatim autocomplete） ---
let searchDebounceTimer = null;
let searchAbortCtrl = null;
let landmarkMarker = null;

async function fetchSuggestions(keyword) {
    // 取消前一筆還在路上的請求，避免舊結果蓋掉新結果
    if (searchAbortCtrl) searchAbortCtrl.abort();
    searchAbortCtrl = new AbortController();

    // 北台灣搜尋邊界（基隆、雙北、桃園），最多 7 筆
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(keyword)}` +
        `&viewbox=121.00,25.30,122.00,24.60&bounded=1&limit=7&accept-language=zh-TW`;

    try {
        const res = await fetch(url, { signal: searchAbortCtrl.signal });
        const data = await res.json();
        renderSuggestions(data || []);
    } catch (err) {
        if (err.name !== 'AbortError') console.error('地標搜尋失敗:', err);
    }
}

function renderSuggestions(results) {
    const box = document.getElementById('search-suggestions');
    box.innerHTML = '';

    if (results.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'suggestion-empty';
        empty.textContent = '在北部區域內找不到相符的地點';
        box.appendChild(empty);
        box.style.display = 'block';
        return;
    }

    results.slice(0, 7).forEach(r => {
        // display_name 格式：「地點名, 路名, 區, 市, ...」→ 拆成主名稱與地址兩行
        const parts = (r.display_name || '').split(',').map(s => s.trim());
        const name = parts[0] || '未命名地點';
        const addr = parts.slice(1).join('、');

        const item = document.createElement('div');
        item.className = 'suggestion-item';

        const nameEl = document.createElement('div');
        nameEl.className = 'suggestion-name';
        nameEl.textContent = `📍 ${name}`;

        const addrEl = document.createElement('div');
        addrEl.className = 'suggestion-addr';
        addrEl.textContent = addr;

        item.appendChild(nameEl);
        if (addr) item.appendChild(addrEl);
        item.addEventListener('click', () => selectSuggestion(parseFloat(r.lat), parseFloat(r.lon), name));
        box.appendChild(item);
    });

    box.style.display = 'block';
}

function selectSuggestion(lat, lng, name) {
    document.getElementById('search-input').value = name;
    hideSuggestions();

    // 移除上一次的地標標記，放上新的橘色標記
    if (landmarkMarker) map.removeLayer(landmarkMarker);
    landmarkMarker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'landmark-icon',
            html: "<div style='background:#FF6B00;width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);'></div>",
            iconSize: [22, 22],
            iconAnchor: [11, 22]
        })
    }).addTo(map).bindPopup(name);

    map.flyTo([lat, lng], 16, { duration: 0.8 });
    landmarkMarker.openPopup();
}

function hideSuggestions() {
    const box = document.getElementById('search-suggestions');
    box.style.display = 'none';
    box.innerHTML = '';
}

// --- 任務標記渲染 ---
async function filterAndRenderTasks(kw, { autoFit = false, flyToOngoing = false } = {}) {
    kw = kw || '';
    taskMarkers.forEach(m => map.removeLayer(m));
    taskMarkers = [];

    try {
        const snapshot = await db.collection('tasks').get();
        const tasks = [];
        snapshot.forEach(doc => tasks.push({ id: doc.id, ...doc.data() }));

        if (currentRole === 'recipient') {
            // 接收人模式：優先顯示我執行中的任務（綠色大標記）
            const ongoing = tasks.find(t => t.handler === currentUser.email && t.status === 'ongoing');
            if (ongoing) {
                const m = L.marker([ongoing.lat, ongoing.lng], {
                    icon: L.divIcon({
                        className: 'active-icon',
                        html: "<div style='background:#4CAF50;width:24px;height:24px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 15px rgba(0,0,0,0.2);'></div>",
                        iconSize: [24, 24]
                    })
                }).addTo(map).on('click', () => showTaskDetail(ongoing));
                taskMarkers.push(m);
                if (flyToOngoing) {
                    map.flyTo([ongoing.lat, ongoing.lng], 17, { duration: 0.8 });
                }
                activeTask = ongoing;
            } else {
                activeTask = null;
            }

            // 大廳可接任務（搜尋字串加防護，避免 title/desc 為空時整段當掉）
            // 5km 模式開啟時，只保留半徑內的任務
            const lobbyTasks = tasks.filter(t =>
                t.status === 'available' &&
                ((t.title || '').includes(kw) || (t.desc || '').includes(kw)) &&
                (!nearbyOnly || (currentGps && calculateDistance(currentGps.lat, currentGps.lng, t.lat, t.lng) <= nearbyRadiusKm * 1000))
            );
            lobbyTasks.forEach(t => {
                const color = t.initiator === currentUser.email ? '#9C27B0' : '#2196F3';
                const m = L.marker([t.lat, t.lng], {
                    icon: L.divIcon({
                        className: 'task-icon',
                        html: `<div style='background:${color};width:20px;height:20px;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,0.2);'></div>`,
                        iconSize: [20, 20]
                    })
                }).addTo(map).on('click', () => showTaskDetail(t));
                taskMarkers.push(m);
            });
        } else {
            // 委託人模式：只顯示我發布且待接單的任務（紫色標記）
            const mine = tasks.filter(t => t.initiator === currentUser.email && t.status === 'available');
            mine.forEach(t => {
                const m = L.marker([t.lat, t.lng], {
                    icon: L.divIcon({
                        className: 'my-task-icon',
                        html: "<div style='background:#9C27B0;width:20px;height:20px;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,0.2);'></div>",
                        iconSize: [20, 20]
                    })
                }).addTo(map).on('click', () => showTaskDetail(t));
                taskMarkers.push(m);
            });
        }

        // 僅在初始載入且無進行中任務時自動縮放涵蓋所有標記（切換角色與日常篩選時保持當前視角與縮放比例）
        if (autoFit && !activeTask && taskMarkers.length > 0 && kw === '') {
            const group = new L.featureGroup(taskMarkers);
            map.fitBounds(group.getBounds().pad(0.3), { maxZoom: 16 });
        }
    } catch (err) {
        console.error('讀取任務失敗:', err);
    }
}

// --- 角色切換（修正原版引用不存在的 main-fab、靠 400ms 輪詢補救的 bug） ---
async function switchRole(r, { initial = false } = {}) {
    currentRole = r;
    const container = document.getElementById('role-toggle-container');
    const publishBtn = document.getElementById('publish-task-btn');

    if (r === 'recipient') {
        container.classList.remove('is-issuer');
        publishBtn.style.display = 'none';
        // 5km 開關只在接收人模式有意義（篩選可接任務）
        document.getElementById('nearby-btn').style.display = 'block';
    } else {
        container.classList.add('is-issuer');
        publishBtn.style.display = 'block';
        document.getElementById('nearby-btn').style.display = 'none';
    }

    document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(r === 'recipient' ? 'btn-role-recipient' : 'btn-role-requester').classList.add('active');

    await filterAndRenderTasks(document.getElementById('search-input').value.trim(), {
        autoFit: initial,
        flyToOngoing: initial
    });
}

// --- 5 公里鄰近模式開關 ---
async function toggleNearbyMode() {
    if (nearbyRadiusKm === 0 && !currentGps) {
        { appAlert('請先點擊「開始定位」，才能開啟鄰近範圍模式！', 'error'); return; }
    }

    // Cycle: 0 -> 5 -> 10 -> 15 -> 0
    if (nearbyRadiusKm === 0) nearbyRadiusKm = 5;
    else if (nearbyRadiusKm === 5) nearbyRadiusKm = 10;
    else if (nearbyRadiusKm === 10) nearbyRadiusKm = 15;
    else nearbyRadiusKm = 0;

    nearbyOnly = (nearbyRadiusKm > 0);
    const btn = document.getElementById('nearby-btn');
    btn.innerText = nearbyOnly ? `📡 ${nearbyRadiusKm}km 內任務` : '🌐 顯示全部任務';
    btn.classList.toggle('active', nearbyOnly);

    updateNearbyCircle();
    
    if (nearbyOnly) {
        // Adjust zoom level based on radius
        let zoomLevel = 13;
        if (nearbyRadiusKm === 10) zoomLevel = 12;
        if (nearbyRadiusKm === 15) zoomLevel = 11;
        map.flyTo([currentGps.lat, currentGps.lng], zoomLevel, { duration: 0.8 });
    }
    await filterAndRenderTasks(document.getElementById('search-input').value.trim());
}

/* 在地圖上畫出以自己為圓心的 5 公里範圍圈 */
function updateNearbyCircle() {
    if (nearbyOnly && currentGps) {
        if (!nearbyCircle) {
            nearbyCircle = L.circle([currentGps.lat, currentGps.lng], {
                radius: nearbyRadiusKm * 1000,
                color: '#FF6B00',
                weight: 2,
                dashArray: '8 6',
                fillColor: '#FF6B00',
                fillOpacity: 0.06
            }).addTo(map);
        } else {
            nearbyCircle.setLatLng([currentGps.lat, currentGps.lng]);
            nearbyCircle.setRadius(nearbyRadiusKm * 1000);
        }
    } else if (nearbyCircle) {
        map.removeLayer(nearbyCircle);
        nearbyCircle = null;
    }
}

// --- GPS 持續追蹤（watchPosition，規格書步驟 5-4） ---
function toggleGps(autoResume = false) {
    isGpsAutoResume = autoResume;
    if (gpsWatchId !== null) { stopGps(); return; }

    if (!navigator.geolocation) { appAlert('此裝置不支援 GPS 定位。', 'error'); return; }
    if (!isTrackingEnabled()) { appAlert('您已在「個人中心」關閉定位追蹤，請先開啟。', 'error'); return; }

    document.getElementById('locate-btn').innerText = '🛰️ 定位中...';
    sessionStorage.setItem('gpsActive', 'true');
    gpsWatchId = navigator.geolocation.watchPosition(onGpsUpdate, onGpsError, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000
    });
}

function onGpsUpdate(pos) {
    const firstFix = !currentGps;
    currentGps = { lat: pos.coords.latitude, lng: pos.coords.longitude };

    setGpsStatus(true);
    document.getElementById('locate-btn').innerText = '🛑 停止定位';

    if (!userMarker) {
        const gpsIcon = L.divIcon({
            className: 'live-gps-dot',
            iconSize: [60, 60],
            iconAnchor: [30, 30]
        });
        userMarker = L.marker([currentGps.lat, currentGps.lng], { icon: gpsIcon, zIndexOffset: 1000 }).addTo(map);
    } else {
        userMarker.setLatLng([currentGps.lat, currentGps.lng]);
    }

    if (firstFix && !isGpsAutoResume) map.flyTo([currentGps.lat, currentGps.lng], 16, { duration: 0.8 });
    updateNearbyCircle();
    checkArrival();
}

function onGpsError(err) {
    console.warn('GPS Error:', err);
    if (err.code === 1) { // PERMISSION_DENIED
        const overlay = document.getElementById('gps-error-overlay');
        if (overlay) overlay.style.display = 'flex';
    } else {
        appAlert('無法取得您的位置，請確認 GPS 已開啟。', 'info');
    }
    stopGps();
}

function stopGps() {
    if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
    }
    currentGps = null;
    if (userMarker) {
        map.removeLayer(userMarker);
        userMarker = null;
    }
    setGpsStatus(false);
    document.getElementById('locate-btn').innerText = '🛰️ 開始定位';
    sessionStorage.removeItem('gpsActive');

    if (nearbyRadiusKm > 0) {
        nearbyRadiusKm = 0;
        nearbyOnly = false;
        const btn = document.getElementById('nearby-btn');
        if (btn) {
            btn.innerText = '🌐 顯示全部任務';
            btn.classList.remove('active');
        }
        if (nearbyCircle) {
            map.removeLayer(nearbyCircle);
            nearbyCircle = null;
        }
        filterAndRenderTasks('');
    }
}

function setGpsStatus(connected) {
    document.getElementById('gps-dot').style.backgroundColor = connected ? '#4CAF50' : '#777';
    document.getElementById('gps-text').innerText = connected ? 'GPS 已連接' : 'GPS 未連接';
}

// --- 模擬移動（測試抵達用方向鍵） ---
function moveUser(dir) {
    if (!isTrackingEnabled()) { appAlert('請先在「個人中心」開啟定位追蹤！', 'error'); return; }
    if (!currentGps) { appAlert('請先點擊「開始定位」！', 'error'); return; }

    const s = 0.0005;
    if (dir === 'up') currentGps.lat += s;
    else if (dir === 'down') currentGps.lat -= s;
    else if (dir === 'left') currentGps.lng -= s;
    else currentGps.lng += s;

    userMarker.setLatLng([currentGps.lat, currentGps.lng]);
    map.panTo([currentGps.lat, currentGps.lng]);
    updateNearbyCircle();
    checkArrival();
}

function checkArrival() {
    if (!activeTask || !currentGps) return;
    const dist = calculateDistance(currentGps.lat, currentGps.lng, activeTask.lat, activeTask.lng);
    const alertBox = document.getElementById('arrival-alert');
    if (dist <= 100 && alertBox.style.display === 'none') {
        alertBox.style.display = 'flex';
    }
}

function calculateDistance(l1, ln1, l2, ln2) {
    const R = 6371e3, p = Math.PI / 180;
    const a = 0.5 - Math.cos((l2 - l1) * p) / 2 +
        Math.cos(l1 * p) * Math.cos(l2 * p) * (1 - Math.cos((ln2 - ln1) * p)) / 2;
    return R * 2 * Math.asin(Math.sqrt(a));
}

// --- 任務詳情與接單 ---
function showTaskDetail(t) {
    selectedTask = t;
    document.getElementById('modal-title').innerText = t.title;
    document.getElementById('modal-reward').innerText = t.reward + ' 點';
    document.getElementById('modal-desc').innerText = t.desc || '（發案人未填寫備註）';
    document.getElementById('modal-loc').innerText = `${t.lat.toFixed(4)}, ${t.lng.toFixed(4)}`;
    const btn = document.querySelector('#task-modal .accept-btn');
    btn.style.display = (currentRole === 'requester' || t.status !== 'available') ? 'none' : 'block';
    document.getElementById('task-modal').style.display = 'flex';
}

/* 接單改用 Firestore Transaction：多人同時搶單只會有一人成功（規格書任務 3-2） */
async function acceptTask() {
    if (!currentGps) { appAlert('請先開始定位，才能接受任務！', 'error'); return; }

    // 禁止接受自己發布的任務
    if (selectedTask.initiator === currentUser.email) {
        { appAlert('❌ 不能接受自己發布的任務！', 'error'); return; }
    }
    if (nearbyOnly) {
        const dist = calculateDistance(currentGps.lat, currentGps.lng, selectedTask.lat, selectedTask.lng);
        if (dist > nearbyRadiusKm * 1000) {
            { appAlert(`❌ 此任務距離您約 ${(dist / 1000).toFixed(1)} 公里，超出 ${nearbyRadiusKm} 公里範圍，無法接受！\n（可點擊切換為更遠範圍以接受任務）`, 'error'); return; }
        }
    }

    const taskRef = db.collection('tasks').doc(selectedTask.id);

    try {
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(taskRef);
            if (!doc.exists) throw new Error('任務不存在或已被刪除');
            if (doc.data().status !== 'available') throw new Error('手慢了！此任務已被其他人接走');
            transaction.update(taskRef, { status: 'ongoing', handler: currentUser.email });
        });
        closeModal();
        map.flyTo([selectedTask.lat, selectedTask.lng], 17, { duration: 0.8 });
        await filterAndRenderTasks('');
        showToast('✅ 接單成功！請前往現場。');
    } catch (err) {
        appAlert('❌ 接單失敗：' + err.message, 'error');
        closeModal();
        await filterAndRenderTasks('');
    }
}

function closeModal() { document.getElementById('task-modal').style.display = 'none'; }

// --- 發布任務 ---
function openPublishModal() { document.getElementById('publish-modal').style.display = 'flex'; }

function closePublishModal() {
    document.getElementById('publish-modal').style.display = 'none';
    isPickingLocation = false;
    document.getElementById('picker-hint').style.display = 'none';
}

function enterMapPickerMode() {
    document.getElementById('publish-modal').style.display = 'none';
    isPickingLocation = true;
    document.getElementById('picker-hint').style.display = 'block';
}

async function submitNewTask() {
    const t = document.getElementById('pub-title').value.trim();
    const r = document.getElementById('pub-reward').value;
    const la = document.getElementById('pub-lat').value;
    const ln = document.getElementById('pub-lng').value;

    if (!t || !r || !la) { appAlert('資訊不完整！請填寫標題、點數並在地圖選取位置。', 'error'); return; }
    const reward = parseInt(r, 10);
    if (isNaN(reward) || reward <= 0) { appAlert('懸賞點數必須大於 0！', 'error'); return; }
    if (currentUser.balance < 10) { appAlert('餘額不足！發布任務需要 10 點。', 'error'); return; }

    try {
        const userRef = db.collection('users').doc(currentUser.email);
        const newTaskRef = db.collection('tasks').doc(); // 預先產生 ID

        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw new Error('使用者不存在');
            const currentBalance = userDoc.data().balance || 0;
            if (currentBalance < 10) throw new Error('餘額不足！發布任務需要 10 點。');

            // 原子操作：扣點 + 記錄交易 + 新增任務
            transaction.update(userRef, { balance: currentBalance - 10 });

            const logRef = userRef.collection('transactions').doc();
            transaction.set(logRef, {
                type: '發布任務', amount: -10, item: `發布：${t}`,
                time: getTimeStr(), ts: Date.now()
            });

            transaction.set(newTaskRef, {
                title: t,
                reward: reward,
                desc: document.getElementById('pub-desc').value,
                lat: parseFloat(la),
                lng: parseFloat(ln),
                status: 'available',
                initiator: currentUser.email,
                handler: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        await refreshUserFromDB();
        filterAndRenderTasks('');
        closePublishModal();
        showToast('🎉 任務發布成功！已扣除 10 點。');
    } catch (err) {
        console.error('發布失敗:', err);
        appAlert('發布失敗：' + err.message, 'error');
    }
}

// --- 抵達回報（防偽相機 + 浮水印） ---
function startReportFromAlert() {
    document.getElementById('arrival-alert').style.display = 'none';
    document.getElementById('camera-input').click();
}

function closeArrivalAlert() { document.getElementById('arrival-alert').style.display = 'none'; }

async function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file || !activeTask) return;

    try {
        // 壓縮至最長邊 1200px，並壓上時間戳 + GPS 座標防偽浮水印
        const compressedBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    let width = img.width, height = img.height;
                    const maxSize = 800;
                    if (width > maxSize || height > maxSize) {
                        if (width > height) { height *= maxSize / width; width = maxSize; }
                        else { width *= maxSize / height; height = maxSize; }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width; canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const fontSize = Math.max(16, Math.floor(width / 25));
                    ctx.font = `bold ${fontSize}px Arial`;
                    ctx.fillStyle = 'rgba(255, 102, 0, 0.8)';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
                    ctx.shadowBlur = 4;
                    const margin = fontSize;
                    const line1 = '【 順路眼 NearPath 】任務回報專用';
                    const line2 = `時間: ${new Date().toLocaleString()}`;
                    const line3 = currentGps ? `座標: ${currentGps.lat.toFixed(4)}, ${currentGps.lng.toFixed(4)}` : '';
                    ctx.fillText(line1, canvas.width - ctx.measureText(line1).width - margin, canvas.height - (margin * 3.5));
                    ctx.fillText(line2, canvas.width - ctx.measureText(line2).width - margin, canvas.height - (margin * 2));
                    if (line3) ctx.fillText(line3, canvas.width - ctx.measureText(line3).width - margin, canvas.height - margin);

                    resolve(canvas.toDataURL('image/jpeg', 0.5));
                };
                img.onerror = () => reject(new Error('圖片載入失敗，請重新拍攝'));
            };
            reader.onerror = reject;
        });

        await db.collection('tasks').doc(activeTask.id).update({
            status: 'reviewing',
            reportImage: compressedBase64,
            reportedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        appAlert('🎉 任務回報成功！\n已完成照片壓縮並壓製防偽浮水印。', 'success');
        activeTask = null;
        filterAndRenderTasks('');
    } catch (err) {
        console.error('回報失敗:', err);
        appAlert('❌ 回報失敗：' + err.message, 'error');
    } finally {
        closeArrivalAlert();
        e.target.value = '';
    }
}
