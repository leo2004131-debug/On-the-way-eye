/* SPA Router */

const tabTitles = {
    'map': '地圖大廳',
    'tasks': '任務管理',
    'wallet': '點數錢包',
    'profile': '個人中心',
    'history': '歷史紀錄'
};

function switchTab(tabId) {
    // Hide all views
    document.querySelectorAll('.spa-view').forEach(v => v.classList.remove('active'));
    
    // Show target view
    const target = document.getElementById('view-' + tabId);
    if (target) {
        target.classList.add('active');
    }
    
    // Update header title
    document.getElementById('app-header-title').innerText = tabTitles[tabId] || '';
    
    // Update bottom nav active state (if not history)
    document.querySelectorAll('.bottom-nav .nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.getElementById('nav-' + tabId);
    if (navItem) {
        navItem.classList.add('active');
    }
    
    // Map specific: invalidate size when showing map, so Leaflet renders correctly
    if (tabId === 'map' && typeof map !== 'undefined' && map !== null) {
        setTimeout(() => map.invalidateSize(), 50);
    }
    
    // Refresh data dynamically when switching to specific tabs
    if (tabId === 'tasks' && typeof renderManagementCenter === 'function') {
        renderManagementCenter();
    }
    if (tabId === 'wallet' && typeof renderWallet === 'function') {
        renderWallet();
    }
    if (tabId === 'profile' && typeof renderReviews === 'function') {
        renderReviews();
    }
}

// Intercept history.back() for history view to go back to wallet
const originalBack = history.back;
window.backToWallet = function() {
    switchTab('wallet');
}
