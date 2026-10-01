import re
import os

files = ['js/map.js', 'js/tasks.js', 'js/wallet.js', 'js/profile.js']

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # handle return alert(...) -> { appAlert(..., 'error'); return; }
    # watch out for single line ifs like `if (...) return alert('...');`
    # replacing `return alert(` with `{ appAlert(` and adding `, 'error'); return; }`?
    
    # Let's do regex
    def repl_return_alert(match):
        msg = match.group(1)
        return f"{{ appAlert({msg}, 'error'); return; }}"
    
    content = re.sub(r"return\s+alert\((.*?)\);", repl_return_alert, content)
    
    # handle regular alert('...') -> appAlert('...', 'error' | 'success' | 'info')
    # Since I don't know success vs error for all, I'll use heuristics:
    # if it contains ❌ or 失敗 or 錯誤 -> error
    # if it contains ✅ or 🎉 or 成功 -> success
    # else info
    def repl_alert(match):
        msg = match.group(1)
        if '❌' in msg or '失敗' in msg or '錯誤' in msg or '不足' in msg or '不完整' in msg:
            icon = 'error'
        elif '✅' in msg or '🎉' in msg or '成功' in msg or '已退還' in msg:
            icon = 'success'
        else:
            icon = 'info'
        return f"appAlert({msg}, '{icon}')"

    content = re.sub(r"alert\((.*?)\)", repl_alert, content)

    # confirm(...) -> await appConfirm(...)
    content = re.sub(r"confirm\((.*?)\)", r"await appConfirm(\1)", content)

    # prompt(...) -> await appPrompt(...)
    content = re.sub(r"prompt\((.*?)\)", r"await appPrompt(\1)", content)

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {file}")
