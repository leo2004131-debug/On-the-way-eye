with open('app.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    # We know the stray tags look exactly like `    </div>\n` and are just hanging out alone.
    # Let's just find the exact block and replace it.
    pass

# Better approach:
with open('app.html', 'r', encoding='utf-8') as f:
    content = f.read()

import re
# Find from <!-- Modals --> to <nav class="bottom-nav">
modals_match = re.search(r'(<!-- Modals -->[\s\S]*?)<nav class="bottom-nav">', content)
if modals_match:
    modals_html = modals_match.group(1)
    
    # We want to remove any `</div>` that is just hanging around.
    # The stray ones are exactly:
    #     </div>
    #         <!-- 2.0 任務管理 -->
    # 
    #         
    #     </div>
    # etc.
    
    # Let's just replace the entire modals_html with ONLY the actual modals.
    # The modals we need are:
    # arrival-alert, task-modal, publish-modal, gps-error-overlay, review-modal, and the camera-input
    pass

