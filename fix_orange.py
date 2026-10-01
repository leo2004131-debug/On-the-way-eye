import os

def replace_exact(content, old, new):
    return content.replace(old, new)

# 1. Update style.css
with open('css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Replace variables
css = replace_exact(css, '--neon-cyan: #00f2ff;\n', '')
css = replace_exact(css, 'var(--neon-cyan)', 'var(--primary-color)')

# Fix base views
css = replace_exact(css, 'background-color: #0A1128;\n    color: white;', 'background-color: var(--bg-color);\n    color: var(--text-main);')
css = replace_exact(css, 'background-color: #0F0524;\n    color: white;', 'background-color: var(--bg-color);\n    color: var(--text-main);')

# Fix inputs
css = replace_exact(css, 'background: rgba(255,255,255,0.1);\n    border: 1px solid rgba(255,255,255,0.2);\n    border-radius: 12px;\n    color: white;', 'background: var(--surface-color);\n    border: 1px solid #ddd;\n    border-radius: 12px;\n    color: var(--text-main);')

css = replace_exact(css, 'background: #1a1a2e;\n    border: 1px solid #333;', 'background: var(--surface-color);\n    border: 1px solid #ddd;')
css = replace_exact(css, 'box-shadow: 0 0 10px rgba(0, 242, 255, 0.2);', 'box-shadow: 0 0 10px rgba(255, 107, 0, 0.2);')
css = replace_exact(css, 'color: white;\n    font-size: 0.95rem;', 'color: var(--text-main);\n    font-size: 0.95rem;')

# Fix avatar & badge
css = replace_exact(css, 'background: #1a1a2e;\n}\n\n.avatar-large', 'background: var(--surface-color);\n}\n\n.avatar-large')
css = replace_exact(css, 'border: 2px solid var(--primary-color);\n    box-shadow: 0 0 15px rgba(0, 242, 255, 0.4);', 'border: 2px solid var(--primary-color);\n    box-shadow: 0 2px 10px rgba(0,0,0,0.1);')
css = replace_exact(css, 'color: #000;\n    border: 2px solid #0F0524;', 'color: white;\n    border: 2px solid white;')
css = replace_exact(css, 'color: var(--primary-color);\n    font-size: 0.8rem;', 'color: var(--text-muted);\n    font-size: 0.8rem;')
css = replace_exact(css, 'color: var(--primary-color);\n    font-size: 1.5rem;', 'color: var(--text-main);\n    font-size: 1.5rem;') # back-btn

# Fix buttons
css = replace_exact(css, 'background: linear-gradient(90deg, var(--primary-color), #ff00ff);', 'background: var(--primary-color);')
css = replace_exact(css, 'box-shadow: 0 5px 20px rgba(255, 0, 255, 0.3);', 'box-shadow: 0 5px 20px rgba(255, 107, 0, 0.3);')

# Cards
css = replace_exact(css, 'background: #1A1A1A;\n    color: white;', 'background: var(--surface-color);\n    color: var(--text-main);')
css = replace_exact(css, 'box-shadow: 0 10px 25px rgba(0,0,0,0.2);', 'box-shadow: 0 10px 25px rgba(0,0,0,0.05);')
css = replace_exact(css, 'margin-left: 5px;\n    color: white;', 'margin-left: 5px;\n    color: var(--text-muted);')

# Toast
css = replace_exact(css, 'background: rgba(30,30,30,0.95); color: #fff;', 'background: var(--surface-color); color: var(--text-main);')
css = replace_exact(css, 'box-shadow: 0 4px 15px rgba(0,0,0,0.5);', 'box-shadow: 0 4px 15px rgba(0,0,0,0.1);')

# Swal
css = replace_exact(css, '.swal-neon-btn', '.swal-primary-btn')
css = replace_exact(css, '.swal-primary-btn { color: #000 !important; font-weight: bold !important; }', '.swal-primary-btn { color: #fff !important; font-weight: bold !important; }')

with open('css/style.css', 'w', encoding='utf-8') as f:
    f.write(css)

# 2. Update common.js (SweetAlert)
with open('js/common.js', 'r', encoding='utf-8') as f:
    js = f.read()

js = replace_exact(js, "background: '#1A1A1A'", "background: '#fff'")
js = replace_exact(js, "color: '#fff'", "color: '#333'")
js = replace_exact(js, "confirmButtonColor: 'var(--neon-cyan)'", "confirmButtonColor: 'var(--primary-color)'")
js = replace_exact(js, "confirmButton: 'swal-neon-btn'", "confirmButton: 'swal-primary-btn'")

with open('js/common.js', 'w', encoding='utf-8') as f:
    f.write(js)

# 3. Update HTML files
for h in ['map.html']:
    with open(h, 'r', encoding='utf-8') as f:
        html = f.read()
    html = replace_exact(html, 'var(--neon-cyan)', 'var(--primary-color)')
    html = replace_exact(html, 'color:white', 'color:var(--text-main)')
    html = replace_exact(html, 'background:rgba(0,0,0,0.9)', 'background:rgba(255,255,255,0.95)')
    html = replace_exact(html, 'color:#000', 'color:#fff')
    with open(h, 'w', encoding='utf-8') as f:
        f.write(html)
        
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()
html = replace_exact(html, 'background-color: #333;"', 'background-color: #eee; color: #333;"')
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Safe update completed.")
