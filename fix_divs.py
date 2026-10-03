with open('app.html', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# We will match the stray divs inside the modals section.
# Specifically, we are looking for `    </div>` followed optionally by `\n` and `<!-- X.X` or `<nav`.
# Actually, why don't I just parse it carefully.
# The exact text to remove: `        \n    </div>\n`
# Let's just do a clean replacement of the known bad blocks.

bad_blocks = [
    "        \n    </div>\n<div id=\"gps-error-overlay\"",
    "        \n    </div>\n        <!-- 3.0 點數錢包 -->",
    "        \n    </div>\n        <!-- 4.0 個人中心 -->",
    "        \n    </div>\n        <!-- 3.1 完整交易明細 -->",
    "        \n    </div>\n\n        <nav class=\"bottom-nav\">"
]

# Wait, regex is safer.
# We want to remove all `    </div>` that are DIRECTLY preceding an HTML comment `<!-- X.X ... -->` or `<nav class="bottom-nav">`
# OR directly preceding `<div id="gps-error-overlay"`
content = re.sub(r'[ \t]*</div>\n(?=<div id="gps-error-overlay")', '', content)
content = re.sub(r'[ \t]*</div>\n(?=[ \t]*<!-- \d\.\d)', '', content)
content = re.sub(r'[ \t]*</div>\n\n(?=[ \t]*<nav class="bottom-nav">)', '\n', content)

with open('app.html', 'w', encoding='utf-8') as f:
    f.write(content)

