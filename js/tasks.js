/* 《順路眼》任務管理中心（tasks.html 專用） */

let currentReviewTaskId = '';
let currentReviewUserRole = '';
let selectedRatingValue = 0;

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireLogin()) return;
    updateHeaderAvatar();
    await refreshUserFromDB();
    renderManagementCenter();
});

function switchTaskSubTab(subId) {
    document.querySelectorAll('.task-sub-view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById('sub-' + subId);
    if (target) target.classList.add('active');

    document.querySelectorAll('.task-tab').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(`'${subId}'`));
    });
}

async function renderManagementCenter() {
    const snapshot = await db.collection('tasks').get();
    const tasks = [];
    snapshot.forEach(doc => tasks.push({ id: doc.id, ...doc.data() }));

    // 1. 我發布的
    document.getElementById('my-posted-list').innerHTML = tasks
        .filter(t => t.initiator === currentUser.email)
        .map(t => {
            let statusCN = '待接單', color = '#ff9800';
            if (t.status === 'ongoing') { statusCN = '進行中'; color = '#2196f3'; }
            else if (t.status === 'reviewing') { statusCN = '待審核'; color = '#e91e63'; }
            else if (t.status === 'completed') { statusCN = '已完成'; color = '#4caf50'; }

            let rateBtn = '';
            if (t.status === 'completed' && !t.posterReviewed) {
                rateBtn = `<button onclick="openReviewModal('${t.id}', 'poster')" class="mini-rate-btn">⭐️ 評價代理人</button>`;
            } else if (t.status === 'completed' && t.posterReviewed) {
                rateBtn = `<span class="rated-note">(已評價 ${t.ratingToReceiver}★)</span>`;
            }

            return `
                <li class="task-card" style="border-left:5px solid ${color};">
                    <div class="task-info">
                        <b>${escapeHTML(t.title)}</b> ${rateBtn}<br>
                        <small>狀態: <span style="color:${color}; font-weight:bold;">${statusCN}</span></small>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div class="reward-tag">${t.reward}點</div>
                        <button onclick="deletePublishedTask('${t.id}', '${escapeHTML(t.title)}')" class="delete-task-btn" title="刪除任務">🗑️</button>
                    </div>
                </li>`;
        }).join('') || "<p class='no-data-msg'>尚無發布紀錄</p>";

    // 2. 我接受的
    document.getElementById('my-accepted-list').innerHTML = tasks
        .filter(t => t.handler === currentUser.email && ['ongoing', 'reviewing', 'completed'].includes(t.status))
        .map(t => {
            let statusCN = '執行中', color = '#2196f3', buttonHtml = '';

            if (t.status === 'reviewing') {
                statusCN = '已回報/待審核'; color = '#e91e63';
                buttonHtml = `<p style="font-size:13px; color:#e91e63; margin:8px 0 0 0;">⏳ 等待委託人審核撥款中...</p>`;
            } else if (t.status === 'completed') {
                statusCN = '任務已完成'; color = '#4caf50';
                buttonHtml = !t.receiverReviewed
                    ? `<div style="margin-top:12px; text-align:right;">
                           <button onclick="openReviewModal('${t.id}', 'receiver')" class="mini-rate-btn">⭐️ 給予委託人評價</button>
                       </div>`
                    : `<div style="text-align:right; margin-top:8px; color:#777; font-size:12px; font-weight:bold;">✓ 已給予發案人 ${t.ratingToPoster}★ 評價</div>`;
            } else {
                buttonHtml = `<div style="margin-top:12px; text-align:right; color:#777; font-size:0.8rem;">💡 抵達目的地後將自動彈出回報視窗（請至地圖大廳）</div>`;
            }

            const description = t.desc ? escapeHTML(t.desc) : '（發案人未填寫備註說明）';
            return `
                <div class="task-card-accepted" style="border-left:5px solid ${color};">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                        <h3 style="margin:0; font-size:16px; font-weight:bold; color:#333; max-width:70%;">${escapeHTML(t.title)}</h3>
                        <span style="color:${color}; font-weight:bold; font-size:14px;">(${statusCN})</span>
                    </div>
                    <div style="font-size:14px; margin-bottom:8px; color:#555;">
                        <strong>任務報酬：</strong>
                        <span style="color:#ff6600; font-weight:bold; font-size:15px;">${t.reward || 0} 點</span>
                    </div>
                    <div class="task-desc-box">
                        <strong style="font-size:13px; color:#666; display:block; margin-bottom:4px;">📝 任務備註與說明：</strong>
                        <p style="margin:0; font-size:13px; color:#444; line-height:1.4; white-space:pre-wrap;">${description}</p>
                    </div>
                    ${buttonHtml}
                </div>`;
        }).join('') || "<p class='no-data-msg'>尚無接受紀錄</p>";

    // 3. 回報審核（我是委託人且有人提交回報）
    const rv = tasks.filter(t => t.status === 'reviewing' && t.initiator === currentUser.email);
    document.getElementById('sub-review').innerHTML = '<div class="section-title">待審核報告</div>' + (rv.map(t => {
        const photoHtml = t.reportImage
            ? `<div style="margin:12px 0;">
                   <span style="font-size:13px; color:#ff6600; font-weight:bold; display:block; margin-bottom:5px;">📸 現場浮水印相片：</span>
                   <img src="${escapeHTML(t.reportImage)}" alt="現場回報照片" style="max-width:100%; border:2px solid #ff6600; border-radius:8px; cursor:pointer;" onclick="window.open(this.src)">
                   <small style="color:#777; display:block; margin-top:4px;">(點擊圖片可放大檢視)</small>
               </div>`
            : `<div style="margin:12px 0; color:#999; font-size:13px;">🚫 未附帶現場相片紀錄</div>`;

        return `
            <div class="review-card" style="border-left:5px solid #ff6600; margin-bottom:15px;">
                <h3 style="margin:0 0 5px 0; font-size:1.1rem; font-weight:bold;">任務：${escapeHTML(t.title)}</h3>
                <div style="color:#28a745; font-size:0.85rem; font-weight:500; margin-bottom:8px;">✓ 座標已驗證 (100m 範圍內)</div>
                <div style="margin:8px 0; font-size:0.9rem;">
                    <strong>任務報酬：</strong> <span style="color:#ff6600; font-weight:bold; font-size:1rem;">${t.reward || 0} 點</span>
                </div>
                ${photoHtml}
                <button class="approve-btn" onclick="completeTask('${t.id}')" style="width:100%; margin-top:12px;">
                    確認證據無誤，核准發款
                </button>
            </div>`;
    }).join('') || "<p class='no-data-msg'>目前無待審核案件</p>");
}

async function deletePublishedTask(id, title) {
    if (!confirm(`確定要刪除「${title}」嗎？\n(此操作無法復原，發布時扣除的 10 點將退還)`)) return;
    try {
        const taskRef = db.collection('tasks').doc(id);
        const userRef = db.collection('users').doc(currentUser.email);

        await db.runTransaction(async (transaction) => {
            const taskDoc = await transaction.get(taskRef);
            if (!taskDoc.exists) throw new Error('任務不存在');
            const tData = taskDoc.data();

            // 權限檢查：只有發起人可以刪除
            if (tData.initiator !== currentUser.email) {
                throw new Error('您不是此任務的發起人，無法刪除');
            }
            // 狀態檢查：只有待接單的任務可以刪除
            if (tData.status !== 'available') {
                throw new Error('此任務已被接單或完成，無法刪除');
            }

            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw new Error('使用者不存在');

            // 退還發布費用 10 點
            transaction.update(userRef, { balance: (userDoc.data().balance || 0) + 10 });
            transaction.delete(taskRef);

            const logRef = userRef.collection('transactions').doc();
            transaction.set(logRef, {
                type: '退還發布費', amount: 10, item: `刪除任務：${title}`,
                time: getTimeStr(), ts: Date.now()
            });
        });

        await refreshUserFromDB();
        alert('🗑️ 任務已刪除，10 點已退還！');
        renderManagementCenter();
    } catch (e) {
        alert('刪除失敗：' + e.message);
    }
}

/* 結案撥款：使用 Firestore Transaction 確保點數與狀態同步更新 */
async function completeTask(taskId) {
    const taskRef = db.collection('tasks').doc(taskId);

    try {
        await db.runTransaction(async (transaction) => {
            const taskDoc = await transaction.get(taskRef);
            if (!taskDoc.exists) throw new Error('任務不存在');

            const tData = taskDoc.data();
            if (tData.status === 'completed') throw new Error('此任務已結案撥款');
            if (!tData.handler) throw new Error('找不到接單人資料');

            const reward = tData.reward || 0;
            const handlerRef = db.collection('users').doc(tData.handler);
            const handlerDoc = await transaction.get(handlerRef);
            if (!handlerDoc.exists) throw new Error('接單人帳號不存在');

            transaction.update(taskRef, { status: 'completed' });
            transaction.update(handlerRef, { balance: (handlerDoc.data().balance || 0) + reward });

            const logRef = handlerRef.collection('transactions').doc();
            transaction.set(logRef, {
                type: '任務酬勞',
                item: `完成任務：${tData.title}`,
                amount: reward,
                time: getTimeStr(),
                ts: Date.now()
            });
        });

        alert('✅ 撥款結案成功！\n點數已發送至代理人錢包。');
        renderManagementCenter();
        // 撥款後自動跳出評價視窗
        setTimeout(() => openReviewModal(taskId, 'poster'), 300);
    } catch (err) {
        console.error('撥款失敗:', err);
        alert('❌ 撥款失敗：' + err.message);
    }
}

// --- 互相評價 ---
function openReviewModal(taskId, role) {
    currentReviewTaskId = taskId;
    currentReviewUserRole = role;
    selectedRatingValue = 0;
    document.getElementById('review-text').value = '';
    document.getElementById('review-modal-title').innerText =
        role === 'poster' ? '📝 評價代理人的服務' : '📝 評價發案委託人';
    resetStars();
    document.getElementById('review-modal').style.display = 'flex';
}

function closeReviewModal() { document.getElementById('review-modal').style.display = 'none'; }

function setTargetRating(rating) {
    selectedRatingValue = rating;
    document.querySelectorAll('.star-btn').forEach(star => {
        star.style.color = (parseInt(star.dataset.value, 10) <= rating) ? '#ff9800' : '#ccc';
    });
}

function resetStars() {
    document.querySelectorAll('.star-btn').forEach(star => star.style.color = '#ccc');
}

async function submitReviewData() {
    if (selectedRatingValue === 0) return alert('請點選星星評分！');
    const comment = document.getElementById('review-text').value.trim();

    try {
        const updateData = {};
        if (currentReviewUserRole === 'poster') {
            updateData.ratingToReceiver = selectedRatingValue;
            updateData.reviewToReceiver = comment;
            updateData.posterReviewed = true;
        } else {
            updateData.ratingToPoster = selectedRatingValue;
            updateData.reviewToPoster = comment;
            updateData.receiverReviewed = true;
        }
        await db.collection('tasks').doc(currentReviewTaskId).update(updateData);

        // 同步到對方的歷史評價牆
        const taskDoc = await db.collection('tasks').doc(currentReviewTaskId).get();
        const targetEmail = (currentReviewUserRole === 'poster')
            ? taskDoc.data().handler
            : taskDoc.data().initiator;

        if (targetEmail) {
            const reviewObj = {
                stars: '⭐'.repeat(selectedRatingValue),
                comment: comment || '優良使用者！',
                date: new Date().toLocaleDateString(),
                from: currentUser.nickname
            };
            const targetRef = db.collection('users').doc(targetEmail);
            const targetDoc = await targetRef.get();
            if (targetDoc.exists) {
                const reviews = targetDoc.data().reviews || [];
                reviews.unshift(reviewObj);
                await targetRef.update({ reviews: reviews });
            }
        }

        alert('🎉 評價成功！已同步至對方的評價牆。');
        closeReviewModal();
        renderManagementCenter();
    } catch (err) {
        console.error('評價失敗:', err);
        alert('評價失敗：' + err.message);
    }
}
