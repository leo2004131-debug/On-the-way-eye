with open('app.html', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# We need to clean up the stray </div> tags before <nav class="bottom-nav">
# Let's find the section between "<!-- Modals -->" and "<nav class=\"bottom-nav\">"
match = re.search(r'(<!-- Modals -->[\s\S]*?)<nav class="bottom-nav">', content)
if match:
    modals_section = match.group(1)
    # Remove any stray </div> tags that are NOT part of a modal.
    # Actually, let's just properly extract the modals from the original files again!
