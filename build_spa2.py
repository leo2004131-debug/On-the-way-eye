import re
import os

html_files = {
    'map': 'map.html',
    'tasks': 'tasks.html',
    'wallet': 'wallet.html',
    'profile': 'profile.html',
    'history': 'history.html'
}

views_content = {}
modals_content = {}

for tab, filename in html_files.items():
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if tab == 'map':
        match = re.search(r'(<section class="map-section">[\s\S]*?</section>)', content)
    else:
        match = re.search(r'(<main>[\s\S]*?</main>)', content)
    
    if match:
        views_content[tab] = match.group(1)
    else:
        views_content[tab] = ''
    
    app_container_match = re.search(r'<div class="app-container">([\s\S]*?)<script', content)
    if app_container_match:
        inner = app_container_match.group(1)
        inner = re.sub(r'<header>[\s\S]*?</header>', '', inner)
        inner = re.sub(r'<nav[^>]*>[\s\S]*?</nav>', '', inner)
        if tab == 'map':
            inner = re.sub(r'<section class="map-section">[\s\S]*?</section>', '', inner)
        else:
            inner = re.sub(r'<main>[\s\S]*?</main>', '', inner)
        modals_content[tab] = inner.strip()
    
    if tab == 'map':
        gps_match = re.search(r'(<div id="gps-error-overlay"[\s\S]*?)</body>', content)
        if gps_match:
            modals_content[tab] += '\n' + gps_match.group(1).strip()

app_html = f"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>順路眼 NearPath - 大廳</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>👁️</text></svg>">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <script src="https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore-compat.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        .spa-view {{ display: none; width: 100%; height: 100%; overflow-y: auto; flex-direction: column; }}
        .spa-view.active {{ display: flex; }}
        /* Override map specific flex issues */
        #view-map {{ overflow: hidden; }}
        /* Clean up duplicate comments */
    </style>
</head>
<body>
    <div class="app-container">
        <header>
            <a id="top-left-avatar-btn" href="#" onclick="switchTab('profile'); return false;" aria-label="個人中心"><span>👤</span></a>
            <h1 id="app-header-title">地圖大廳</h1>
        </header>

        <div id="view-map" class="spa-view active">
            {views_content.get('map', '')}
        </div>
        
        <div id="view-tasks" class="spa-view">
            {views_content.get('tasks', '')}
        </div>
        
        <div id="view-wallet" class="spa-view">
            {views_content.get('wallet', '')}
        </div>
        
        <div id="view-profile" class="spa-view">
            {views_content.get('profile', '')}
        </div>

        <div id="view-history" class="spa-view">
            {views_content.get('history', '')}
        </div>

        <!-- Modals -->
        {modals_content.get('map', '')}
        {modals_content.get('tasks', '')}
        {modals_content.get('wallet', '')}
        {modals_content.get('profile', '')}
        {modals_content.get('history', '')}

        <nav class="bottom-nav">
            <a href="#" onclick="switchTab('map'); return false;" class="nav-item active" id="nav-map"><span>📍</span><span>地圖</span></a>
            <a href="#" onclick="switchTab('tasks'); return false;" class="nav-item" id="nav-tasks"><span>📋</span><span>任務</span></a>
            <a href="#" onclick="switchTab('wallet'); return false;" class="nav-item" id="nav-wallet"><span>💰</span><span>錢包</span></a>
            <a href="#" onclick="switchTab('profile'); return false;" class="nav-item" id="nav-profile"><span>👤</span><span>個人</span></a>
        </nav>
    </div>

    <script src="js/firebase-config.js"></script>
    <script src="js/common.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/map.js"></script>
    <script src="js/tasks.js"></script>
    <script src="js/wallet.js"></script>
    <script src="js/profile.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
"""

# Fix up any leftover href="history.html" inside the generated HTML
app_html = app_html.replace('href="history.html"', 'href="#" onclick="switchTab(\'history\'); return false;"')

with open('app.html', 'w', encoding='utf-8') as f:
    f.write(app_html)

print("Generated app.html correctly.")
