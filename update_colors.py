import os
import re

# 1. Update style.css
css_path = 'css/style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

# CSS Replacements
css = re.sub(r'--neon-cyan:\s*#[0-9a-fA-F]+;', '', css) # Remove neon-cyan
css = css.replace('var(--neon-cyan)', 'var(--primary-color)')

css = re.sub(r'\.login-view\s*\{[^}]*\}', 
             '.login-view {\n    position: absolute;\n    top: 0; left: 0; width: 100%; height: 100%;\n    background-color: var(--bg-color);\n    color: var(--text-main);\n    display: flex;\n    flex-direction: column;\n    padding: 40px 30px;\n    z-index: 5000;\n}', css)

css = re.sub(r'\.register-view\s*\{[^}]*\}', 
             '.register-view {\n    position: absolute;\n    top: 0; left: 0; width: 100%; height: 100%;\n    background-color: var(--bg-color);\n    color: var(--text-main);\n    display: flex;\n    flex-direction: column;\n    padding: 30px;\n    z-index: 5100;\n    overflow-y: auto;\n}', css)

css = re.sub(r'\.input-field input\s*\{[^}]*\}', 
             '.input-field input {\n    width: 100%;\n    padding: 15px;\n    background: var(--surface-color);\n    border: 1px solid #ddd;\n    border-radius: 12px;\n    color: var(--text-main);\n    font-size: 1rem;\n    outline: none;\n}', css)

css = css.replace('.neon-input-group {\n    background: #1a1a2e;\n    border: 1px solid #333;', 
                  '.neon-input-group {\n    background: var(--surface-color);\n    border: 1px solid #ddd;')
css = css.replace('box-shadow: 0 0 10px rgba(0, 242, 255, 0.2);', 'box-shadow: 0 0 10px rgba(255, 107, 0, 0.2);')
css = css.replace('.neon-input-group input {\n    flex: 1;\n    background: none;\n    border: none;\n    color: white;',
                  '.neon-input-group input {\n    flex: 1;\n    background: none;\n    border: none;\n    color: var(--text-main);')

css = re.sub(r'\.reg-main-btn\s*\{[^}]*\}', 
             '.reg-main-btn {\n    width: 100%;\n    padding: 16px;\n    background: var(--primary-color);\n    color: white;\n    border: none;\n    border-radius: 50px;\n    font-size: 1.1rem;\n    font-weight: bold;\n    cursor: pointer;\n    margin-top: 20px;\n    box-shadow: 0 5px 20px rgba(255, 107, 0, 0.3);\n}', css)

css = css.replace('.neon-border {\n    border: 2px solid var(--neon-cyan);\n    box-shadow: 0 0 15px rgba(0, 242, 255, 0.4);\n}',
                  '.neon-border {\n    border: 2px solid var(--primary-color);\n    box-shadow: 0 2px 10px rgba(0,0,0,0.1);\n}')

css = css.replace('.camera-badge {\n    position: absolute;\n    bottom: 0;\n    right: 0;\n    background: var(--neon-cyan);\n    width: 25px;\n    height: 25px;\n    border-radius: 50%;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    font-size: 12px;\n    color: #000;\n    border: 2px solid #0F0524;\n}',
                  '.camera-badge {\n    position: absolute;\n    bottom: 0;\n    right: 0;\n    background: var(--primary-color);\n    width: 25px;\n    height: 25px;\n    border-radius: 50%;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    font-size: 12px;\n    color: white;\n    border: 2px solid white;\n}')

css = css.replace('.avatar-label {\n    color: var(--neon-cyan);', '.avatar-label {\n    color: var(--text-muted);')
css = css.replace('.back-btn {\n    background: none;\n    border: none;\n    color: var(--neon-cyan);', '.back-btn {\n    background: none;\n    border: none;\n    color: var(--text-main);')

css = re.sub(r'\.wallet-card\s*\{[^}]*\}', 
             '.wallet-card {\n    background: var(--surface-color);\n    color: var(--text-main);\n    padding: 30px 20px;\n    border-radius: 20px;\n    text-align: center;\n    margin-bottom: 20px;\n    box-shadow: 0 10px 25px rgba(0,0,0,0.05);\n}', css)

css = css.replace('.wallet-balance span:last-child {\n    font-size: 1.2rem;\n    margin-left: 5px;\n    color: white;\n}',
                  '.wallet-balance span:last-child {\n    font-size: 1.2rem;\n    margin-left: 5px;\n    color: var(--text-muted);\n}')

css = re.sub(r'\.profile-card\s*\{[^}]*\}', 
             '.profile-card {\n    background: var(--surface-color);\n    color: var(--text-main);\n    padding: 25px;\n    border-radius: 20px;\n    margin-bottom: 20px;\n    width: 100%;\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    justify-content: center;\n    box-sizing: border-box;\n    box-shadow: 0 4px 15px rgba(0,0,0,0.05);\n}', css)

# Toast styles
css = css.replace('background: rgba(30,30,30,0.95); color: #fff;', 'background: var(--surface-color); color: var(--text-main);')
css = css.replace('box-shadow: 0 4px 15px rgba(0,0,0,0.5);', 'box-shadow: 0 4px 15px rgba(0,0,0,0.1);')

# Swal styles
css = css.replace('.swal-neon-btn', '.swal-primary-btn')
css = css.replace('.swal-neon-btn { color: #000 !important; font-weight: bold !important; }', '.swal-primary-btn { color: #fff !important; font-weight: bold !important; }')

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css)

# 2. Update common.js (SweetAlert dark to light)
js_path = 'js/common.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

js = js.replace("background: '#1A1A1A'", "background: '#fff'")
js = js.replace("color: '#fff'", "color: '#333'")
js = js.replace("confirmButtonColor: 'var(--neon-cyan)'", "confirmButtonColor: 'var(--primary-color)'")
js = js.replace("confirmButton: 'swal-neon-btn'", "confirmButton: 'swal-primary-btn'")

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)

# 3. Update HTML files containing var(--neon-cyan)
for html_file in ['map.html']:
    with open(html_file, 'r', encoding='utf-8') as f:
        html = f.read()
    html = html.replace('var(--neon-cyan)', 'var(--primary-color)')
    html = html.replace('color:white', 'color:var(--text-main)')
    html = html.replace('background:rgba(0,0,0,0.9)', 'background:rgba(255,255,255,0.95)')
    html = html.replace('color:#000', 'color:#fff')
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html)
        
print("Updated successfully.")
