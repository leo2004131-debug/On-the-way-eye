import re

css_path = 'css/style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

css = css.replace('background: #1a1a2e;', 'background: var(--surface-color);')
css = css.replace('border: 2px solid #0F0524;', 'border: 2px solid var(--surface-color);')

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css)

print("Updated successfully.")
