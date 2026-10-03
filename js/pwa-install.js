let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    
    // Check if we already showed it today
    if (localStorage.getItem('pwaPromptDismissed')) return;

    // Show our custom UI
    setTimeout(() => {
        appConfirm('推薦安裝順路眼 App', '將順路眼加到主畫面，享受全螢幕、無廣告、更省電的原生體驗！\n(安裝完全免費且不佔空間)')
        .then(accepted => {
            if (accepted) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the A2HS prompt');
                    } else {
                        console.log('User dismissed the A2HS prompt');
                    }
                    deferredPrompt = null;
                });
            } else {
                localStorage.setItem('pwaPromptDismissed', 'true');
            }
        });
    }, 3000);
});

// iOS Safari detection
const isIos = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
};
// Detects if device is in standalone mode
const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

window.addEventListener('DOMContentLoaded', () => {
    if (isIos() && !isInStandaloneMode()) {
        if (!localStorage.getItem('iosPwaPromptDismissed')) {
            setTimeout(() => {
                appAlert('💡 iOS 安裝提示：\n點擊瀏覽器下方「分享」按鈕 📤\n選擇「加入主畫面 ➕」\n即可享有全螢幕 App 體驗！', 'info')
                .then(() => {
                    localStorage.setItem('iosPwaPromptDismissed', 'true');
                });
            }, 3000);
        }
    }
});
