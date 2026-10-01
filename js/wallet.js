/* 《順路眼》點數錢包（wallet.html 與 history.html 共用） */

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireLogin()) return;
    updateHeaderAvatar();
    await refreshUserFromDB();
    renderWallet();
});

async function addPoints(amt) {
    if (!currentUser) return;
    const amount = parseInt(amt, 10);
    if (isNaN(amount) || amount <= 0) return alert('請輸入有效的儲值金額！');

    try {
        const userRef = db.collection('users').doc(currentUser.email);
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(userRef);
            if (!doc.exists) throw new Error('使用者不存在');
            const newBalance = (doc.data().balance || 0) + amount;
            transaction.update(userRef, { balance: newBalance });

            const logRef = userRef.collection('transactions').doc();
            transaction.set(logRef, {
                type: '儲值', amount: amount, item: `加點 +${amount}`,
                time: getTimeStr(), ts: Date.now()
            });
        });
        // Transaction 成功後同步本地狀態
        await refreshUserFromDB();
        renderWallet();
        alert('儲值成功！');
    } catch (err) {
        alert('儲值失敗：' + err.message);
    }
}

async function exchangeProduct(name, price) {
    if (!currentUser) return;
    if (currentUser.balance < price) return alert('點數不足！');

    try {
        const userRef = db.collection('users').doc(currentUser.email);
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(userRef);
            if (!doc.exists) throw new Error('使用者不存在');
            const currentBalance = doc.data().balance || 0;
            if (currentBalance < price) throw new Error('點數不足！');
            transaction.update(userRef, { balance: currentBalance - price });

            const logRef = userRef.collection('transactions').doc();
            transaction.set(logRef, {
                type: '兌換', amount: -price, item: name,
                time: getTimeStr(), ts: Date.now()
            });
        });
        await refreshUserFromDB();
        renderWallet();
        alert(`🎉 兌換成功！已兌換「${name}」`);
    } catch (err) {
        alert('兌換失敗：' + err.message);
    }
}

async function renderWallet() {
    if (!currentUser) return;

    const balanceEl = document.getElementById('wallet-balance-val');
    if (balanceEl) balanceEl.innerText = currentUser.balance;

    // 修正：原版用中文時間字串 orderBy 排序錯亂，改抓全部後以數字時間戳排序
    let txs = [];
    try {
        const snp = await db.collection('users').doc(currentUser.email)
            .collection('transactions').get();
        snp.forEach(d => txs.push(d.data()));
        txs.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    } catch (err) {
        console.error('讀取交易紀錄失敗:', err);
    }

    // 錢包頁：摘要（前 10 筆）
    const summaryEl = document.getElementById('transaction-list');
    if (summaryEl) {
        summaryEl.innerHTML = txs.slice(0, 10).map(t => `
            <div class="wallet-transaction-card" style="flex-direction:column; align-items:stretch; gap:0;">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                    <div><b>${t.type}</b><br><small>${t.time}</small></div>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="tx-amount ${t.amount >= 0 ? 'tx-plus' : 'tx-minus'}">${t.amount >= 0 ? '+' : ''}${t.amount}</span>
                        <button class="more-btn" onclick="toggleTransactionDetail(event)">詳情</button>
                    </div>
                </div>
                <div class="wallet-detail-expanded-panel">
                    項目：${t.item || '一般交易'}<br>
                    餘額變動：${t.amount} 點
                </div>
            </div>`).join('') || "<p class='no-data-msg'>尚無紀錄</p>";
    }

    // 完整明細頁：全部紀錄
    const fullListEl = document.getElementById('full-transaction-list');
    if (fullListEl) {
        fullListEl.innerHTML = txs.map(t => `
            <div class="wallet-transaction-card" style="flex-direction:column; align-items:stretch; gap:0;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="font-size:15px; color:#333;">${t.type}${t.item ? ` (${t.item})` : ''}</strong>
                        <div style="font-size:12px; color:#999; margin-top:4px;">${t.time}</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <span class="tx-amount ${t.amount >= 0 ? 'tx-plus' : 'tx-minus'}">${t.amount >= 0 ? '+' : ''}${t.amount}</span>
                        <button class="more-btn outlined" onclick="toggleTransactionDetail(event)">展開</button>
                    </div>
                </div>
                <div class="wallet-detail-expanded-panel">
                    📌 交易項目：${t.item || '點數變動'}<br>
                    💰 變動金額：${t.amount} Points<br>
                    🕒 確切時間：${t.time}
                </div>
            </div>`).join('') || "<p class='no-data-msg'>目前尚無交易明細</p>";
    }
}

function toggleTransactionDetail(e) {
    if (e) e.preventDefault();
    const btn = e.target.closest('.more-btn');
    if (!btn) return;
    const card = btn.closest('.wallet-transaction-card');
    const detail = card && card.querySelector('.wallet-detail-expanded-panel');
    if (detail) {
        const isHidden = getComputedStyle(detail).display === 'none';
        detail.style.display = isHidden ? 'block' : 'none';
        btn.innerText = isHidden ? '收起' : (btn.classList.contains('outlined') ? '展開' : '詳情');
    }
}
