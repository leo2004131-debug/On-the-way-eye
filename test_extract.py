import re

with open('map.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Map section
match = re.search(r'(<section class="map-section">[\s\S]*?</section>)', content)
print("Map section length:", len(match.group(1)) if match else "None")

# Modals
app_container_match = re.search(r'<div class="app-container">([\s\S]*?)<script', content)
if app_container_match:
    inner = app_container_match.group(1)
    inner = re.sub(r'<header>[\s\S]*?</header>', '', inner)
    inner = re.sub(r'<nav[^>]*>[\s\S]*?</nav>', '', inner)
    inner = re.sub(r'<section class="map-section">[\s\S]*?</section>', '', inner)
    print("Map app-container modals length:", len(inner.strip()))

gps_match = re.search(r'(<div id="gps-error-overlay"[\s\S]*?)</body>', content)
if gps_match:
    gps_div = gps_match.group(1).strip()
    print("GPS overlay length:", len(gps_div))
