import re

# 1. Update common.js (Add compressImage)
with open('js/common.js', 'r', encoding='utf-8') as f:
    common_js = f.read()

compress_func = """
function compressImage(file, maxWidth, maxHeight, quality = 0.6) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height = Math.round(height * (maxWidth / width));
                        width = maxWidth;
                    } else {
                        width = Math.round(width * (maxHeight / height));
                        height = maxHeight;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => reject(new Error('圖片解析失敗'));
        };
        reader.onerror = () => reject(new Error('圖片讀取失敗'));
        reader.readAsDataURL(file);
    });
}
"""

if "function compressImage" not in common_js:
    # Append at the top after currentUser declaration
    common_js = common_js.replace("let currentUser = null;\n", "let currentUser = null;\n" + compress_func)
    with open('js/common.js', 'w', encoding='utf-8') as f:
        f.write(common_js)

# 2. Update auth.js (previewAvatar)
with open('js/auth.js', 'r', encoding='utf-8') as f:
    auth_js = f.read()

old_preview = """function previewAvatar(e) {
    const fr = new FileReader();
    fr.onload = (ev) => {
        userAvatarData = ev.target.result;
        const ip = document.getElementById('avatar-img-preview');
        ip.src = userAvatarData;
        ip.style.display = 'block';
        document.getElementById('default-avatar-icon').style.display = 'none';
    };
    fr.onerror = () => {
        appAlert('❌ 圖片讀取失敗，請重新選擇檔案', 'error');
    };
    if (e.target.files[0]) fr.readAsDataURL(e.target.files[0]);
}"""

new_preview = """async function previewAvatar(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
        userAvatarData = await compressImage(file, 400, 400, 0.6);
        const ip = document.getElementById('avatar-img-preview');
        ip.src = userAvatarData;
        ip.style.display = 'block';
        document.getElementById('default-avatar-icon').style.display = 'none';
    } catch (err) {
        appAlert('❌ ' + err.message, 'error');
    }
}"""

auth_js = auth_js.replace(old_preview, new_preview)
with open('js/auth.js', 'w', encoding='utf-8') as f:
    f.write(auth_js)

# 3. Update profile.js (handleChangeAvatar)
with open('js/profile.js', 'r', encoding='utf-8') as f:
    profile_js = f.read()

old_handle = """function handleChangeAvatar(e) {
    const fr = new FileReader();
    fr.onload = async (ev) => {
        const img = ev.target.result;
        try {
            await db.collection('users').doc(currentUser.email).update({ avatar: img });
            currentUser.avatar = img;
            saveCurrentUser();
            updateProfileAvatarDisplay();
            updateHeaderAvatar();
            appAlert('頭像更新成功！', 'success');
        } catch (err) {
            appAlert('更新失敗：' + err.message, 'error');
        }
    };
    fr.onerror = () => {
        appAlert('❌ 圖片讀取失敗，請重新選擇檔案', 'error');
    };
    if (e.target.files[0]) fr.readAsDataURL(e.target.files[0]);
}"""

new_handle = """async function handleChangeAvatar(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
        const compressedImg = await compressImage(file, 400, 400, 0.6);
        await db.collection('users').doc(currentUser.email).update({ avatar: compressedImg });
        currentUser.avatar = compressedImg;
        saveCurrentUser();
        updateProfileAvatarDisplay();
        updateHeaderAvatar();
        appAlert('頭像更新成功！', 'success');
    } catch (err) {
        appAlert('操作失敗：' + err.message, 'error');
    }
}"""

profile_js = profile_js.replace(old_handle, new_handle)
with open('js/profile.js', 'w', encoding='utf-8') as f:
    f.write(profile_js)

# 4. Update map.js (handlePhoto)
with open('js/map.js', 'r', encoding='utf-8') as f:
    map_js = f.read()

map_js = map_js.replace('const maxSize = 1200;', 'const maxSize = 800;')
map_js = map_js.replace("canvas.toDataURL('image/jpeg', 0.6)", "canvas.toDataURL('image/jpeg', 0.5)")
with open('js/map.js', 'w', encoding='utf-8') as f:
    f.write(map_js)

print("Compression logic successfully implemented.")
