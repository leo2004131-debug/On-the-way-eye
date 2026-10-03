import re

with open('app.html', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to insert a </div> for gps-error-overlay just before <!-- 2.0 任務管理 -->
content = content.replace("        <!-- 2.0 任務管理 -->", "    </div>\n        <!-- 2.0 任務管理 -->")

with open('app.html', 'w', encoding='utf-8') as f:
    f.write(content)
