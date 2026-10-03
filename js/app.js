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
        requestAnimationFrame(() => map.invalidateSize());
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

// SPA Central Initialization
document.addEventListener('DOMContentLoaded', async () => {
    // Check if we are on the SPA page
    if (!document.getElementById('app-header-title')) return;

    if (typeof requireLogin === 'function' && !requireLogin()) return;
    if (typeof updateHeaderAvatar === 'function') updateHeaderAvatar();
    if (typeof refreshUserFromDB === 'function') await refreshUserFromDB();

    // 1. Map Init
    if (typeof initMap === 'function') {
        const isFirstVisit = !sessionStorage.getItem('mapView');
        initMap();
        
        // Auto-start GPS logic
        if (typeof isTrackingEnabled === 'function' && isTrackingEnabled() && typeof toggleGps === 'function') {
            if (isFirstVisit) {
                // First visit this session: auto-start and fly to user
                toggleGps(false);
            } else if (sessionStorage.getItem('gpsActive')) {
                // Refreshed page while GPS was active: resume tracking silently (no fly)
                toggleGps(true);
            }
        }
        
        if (typeof switchRole === 'function') switchRole('recipient', { initial: isFirstVisit });
    }

    // 2. Profile Init
    if (document.getElementById('profile-name') && typeof currentUser !== 'undefined' && currentUser) {
        document.getElementById('profile-name').innerText = currentUser.nickname || '使用者';
        if (typeof updateProfileAvatarDisplay === 'function') updateProfileAvatarDisplay();
        if (typeof renderReviews === 'function') renderReviews();
        const toggleGpsTracking = document.getElementById('toggle-gps-tracking');
        if (toggleGpsTracking && typeof isTrackingEnabled === 'function') {
            toggleGpsTracking.checked = isTrackingEnabled();
        }
    }

    // 3. Tasks & Wallet Init
    if (typeof renderManagementCenter === 'function') renderManagementCenter();
    if (typeof renderWallet === 'function') renderWallet();
});

// Responsive map size handling
if (typeof window.ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => {
        if (typeof map !== 'undefined' && map !== null) {
            requestAnimationFrame(() => map.invalidateSize());
        }
    });
    window.addEventListener('DOMContentLoaded', () => {
        const mapContainer = document.getElementById('view-map');
        if (mapContainer) ro.observe(mapContainer);
    });
}
