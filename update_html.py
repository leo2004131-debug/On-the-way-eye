import os

html_files = ['index.html', 'register.html', 'map.html', 'tasks.html', 'wallet.html', 'profile.html', 'history.html', '404.html']
tag = '<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>'

for file in html_files:
    if os.path.exists(file):
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if tag not in content:
            content = content.replace('</head>', f'    {tag}\n</head>')
            with open(file, 'w', encoding='utf-8') as f:
                f.write(content)
        print(f"Updated {file}")
    else:
        print(f"File not found: {file}")
