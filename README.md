# 《順路眼》LBS 微型勞動力平台 — 整合版

統整自「專題製作網頁」（新版單檔 App）與「報廢專題」（舊版原型）兩個資料夾，
以新版功能為主體，拆分為多個獨立頁面，並修復原版已知 bug。

## 檔案結構

```
順路眼-整合版/
├── index.html      # 登入頁（已登入自動跳轉地圖大廳）
├── register.html   # 註冊頁（Cyber-Neon 風格、頭像上傳）
├── map.html        # 1.0 地圖大廳（Leaflet 地圖、角色切換、發案、接單、GPS、回報）
├── tasks.html      # 2.0 任務管理（我發布的／我接受的／回報審核、互相評價）
├── wallet.html     # 3.0 點數錢包（餘額、儲值、交易摘要、點數商城）
├── history.html    # 3.1 完整交易明細
├── profile.html    # 4.0 個人中心（頭像、隱私開關、改密碼、歷史評價、登出）
├── css/
│   └── style.css   # 全站共用樣式
└── js/
    ├── firebase-config.js  # Firebase 初始化
    ├── common.js           # 登入狀態守衛、交易紀錄寫入、共用工具
    ├── auth.js             # 登入／註冊／開發者登入
    ├── map.js              # 地圖大廳全部邏輯
    ├── tasks.js            # 任務管理與評價
    ├── wallet.js           # 錢包與交易明細
    └── profile.js          # 個人中心
```

## 相較原版修復的 Bug

1. **發布任務按鈕**：原版 `switchRole` 引用不存在的 `main-fab`，靠每 400ms
   輪詢整個 DOM 的補丁（`forceGuardPublishButton`）硬撐。已改為正確切換並移除輪詢。
2. **交易紀錄排序**：原版用中文時間字串（「下午 03:24」）做 `orderBy`，順序錯亂。
   改為寫入數字時間戳 `ts` 並以此排序。
3. **發布任務沒留帳**：原版扣 10 點但不寫交易紀錄，錢包對不上帳。已補上。
4. **接單併發**：原版直接 update，多人搶單會互相覆蓋。改用 Firestore
   Transaction，僅一人成功（符合規格書任務 3-2）。
5. **開發者登入**：原版未在資料庫建立 dev 文件，儲值／兌換會直接報錯。已修正。
6. **GPS 持續追蹤**：原版只 `getCurrentPosition` 定位一次。改用
   `watchPosition`，走動時藍點自動跟隨並觸發抵達偵測（符合 GPS 規格步驟 5-4）。
7. **搜尋崩潰防護**：任務 `title`／`desc` 為空時 `includes()` 會丟例外，已加防護。
8. **隱私開關跨頁生效**：定位追蹤開關存於 `localStorage`，地圖頁與個人中心同步。

## 自舊版（報廢專題）保留的優點

- Google Maps 標準底圖（解決原版 CartoDB 浮水印及 OSM 本機 403 阻擋問題，最熟悉的台灣地圖體驗）
- JS 與 HTML 分離的檔案架構

## 使用方式

由於使用 Firebase 與瀏覽器定位，建議透過本機伺服器開啟（直接雙擊 HTML 也可運作，
但 GPS 在非 https/localhost 環境會被瀏覽器封鎖）：

```
cd 順路眼-整合版
python -m http.server 8000
# 瀏覽器開啟 http://localhost:8000
```

測試帳號：點「開發者登入 (快速測試)」即可（餘額 9999 點）。
