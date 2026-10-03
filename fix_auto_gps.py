import re

with open('js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace the Map Init block
old_init = """    // 1. Map Init
    if (typeof initMap === 'function') {
        const isFirstVisit = !sessionStorage.getItem('mapView');
        initMap();
        if (sessionStorage.getItem('gpsActive') && typeof toggleGps === 'function') {
            toggleGps(true);
        }
        if (typeof switchRole === 'function') switchRole('recipient', { initial: isFirstVisit });
    }"""

new_init = """    // 1. Map Init
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
    }"""

if old_init in js:
    js = js.replace(old_init, new_init)
    with open('js/app.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print("Fixed auto GPS")
else:
    print("Could not find old init block")

