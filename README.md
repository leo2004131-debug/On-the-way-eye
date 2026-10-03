# 《順路眼》LBS 行動接單助理 (On-the-way-eye)

這是一個以「行動裝置優先 (Mobile-First)」與「PWA (漸進式網頁應用程式)」為核心架構的 LBS (Location-Based Service) 任務接單平台。

本專案已從傳統多頁面網站重構為 **SPA (Single-Page Application 單頁應用程式)**，帶來如同原生 App 般「零延遲、不重整」的極致流暢體驗。

## 🚀 核心特色與升級 (v2.0 SPA + PWA)

1. **SPA 單頁架構 (`app.html`)**
   - 捨棄了多個 HTML 頁面跳轉，所有的功能（地圖大廳、任務管理、點數錢包、個人中心）全部整合在單一的 `app.html`。
   - 分頁切換瞬間完成，無須重新載入畫面。

2. **真正的 PWA 應用程式**
   - 支援加入手機桌面 (Add to Home Screen)，擁有專屬 App Icon，開啟後自動隱藏網址列，100% 全螢幕沉浸體驗。
   - **自訂安裝引導 (`pwa-install.js`)**：主動攔截瀏覽器安裝事件，並針對 Android 與 iOS Safari 打造專屬的安裝提示框，大幅提升 App 下載率。
   - **Service Worker (`sw.js`)**：完整的離線快取機制，秒開網頁。

3. **地圖與 GPS 大幅優化**
   - **超即時硬體追蹤**：強制要求手機 GPS 提供 `maximumAge: 0` 的絕對即時定位，走路步伐不延遲。
   - **雷達波紋定位點**：捨棄死板的靜態圓點，改用純 CSS 刻劃的「透明邊框無限雷達波紋」，視覺效果媲美主流地圖 App，並修復了手機版 Chrome 的 GPU 切割破圖 (Clipping) 漏洞。
   - **無縫地圖重繪**：導入 `ResizeObserver` 與 `requestAnimationFrame`，在電腦版切換分頁或拉動視窗時，地圖以 60fps 瞬間重繪，徹底消除破圖卡頓。

4. **電腦版 (Desktop) 完美兼容**
   - 響應式鎖定 `960px` 寬度的漂浮 App 模擬器外觀，符合手機操作直覺。
   - 導入專屬透明懸浮捲軸 (6px) 與 `scrollbar-gutter: stable`，徹底解決 Windows/Chrome 電腦版在資料載入時捲軸出現所造成的「畫面左右跳動」Layout Shift 痛點。

5. **系統安全與除錯**
   - 全面引入 `escapeHTML()` 防止 XSS 攻擊。
   - 原生的 `alert` 與 `confirm` 已全部升級為高質感的 **SweetAlert2**，且具備霓虹 Cyberpunk 視覺風格。
   - 交易紀錄 (`wallet.js`) 與 GPS `switchRole` 潛在非同步 Bug 均已修復。

## 📂 檔案結構

```
順路眼/
├── index.html          # 登入與註冊入口 (自動判斷狀態跳轉)
├── register.html       # 註冊頁 (支援密碼確認與 Email 驗證)
├── app.html            # 🌟 核心 SPA 單頁容器 (包含所有 View)
├── 404.html            # Vercel 路由防護頁 (含智慧導航)
├── manifest.json       # PWA 安裝設定檔
├── icon.svg            # PWA 高清向量圖示
├── sw.js               # Service Worker 快取腳本
├── vercel.json         # Vercel 靜態路由快取控制
├── css/
│   └── style.css       # 全站共用與 RWD 樣式
└── js/
    ├── firebase-config.js  # Firebase 初始化
    ├── common.js           # XSS防禦、共用狀態與 SweetAlert 封裝
    ├── auth.js             # 登入邏輯與快速測試
    ├── pwa-install.js      # 📱 iOS/Android 專屬 PWA 安裝提示機制
    ├── app.js              # SPA 路由管理與 ResizeObserver
    ├── map.js              # Leaflet 地圖、GPS 雷達點與動態生成
    ├── tasks.js            # 發案、接單、回報與審核邏輯
    ├── wallet.js           # 點數儲值與即時交易紀錄
    └── profile.js          # 頭像上傳與個人資料維護
```

## 🛠️ 開發與部署指南

由於使用了 Service Worker 與硬體 GPS API，專案**必須**在 `https://` 或 `localhost` 環境下才能正常運作。

### 本機測試
```bash
python -m http.server 8000
# 使用瀏覽器開啟 http://localhost:8000
```
> **快速測試**：點擊首頁「開發者登入 (快速測試)」即可一鍵取得包含 9999 點餘額的測試帳號。

### 線上部署 (Vercel)
專案已內建 `vercel.json`，直接將專案推送到 GitHub 並關聯至 Vercel，系統即會自動開啟 `cleanUrls`（隱藏 `.html` 副檔名）並套用正確的快取標頭 (Cache-Control)。
