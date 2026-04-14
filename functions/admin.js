// functions/admin.js - 后台管理
export async function onRequestGet({ request, env }) {
    // 检查登录状态
    const cookie = request.headers.get('Cookie') || '';
    const match = cookie.match(/admin_token=([^;]+)/);
    let isLoggedIn = false;
    
    if (match) {
        const session = await NAV_KV.get(`session:${match[1]}`);
        isLoggedIn = session !== null;
    }
    
    if (!isLoggedIn) {
        return new Response(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>登录后台</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:system-ui;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;display:flex;justify-content:center;align-items:center;}
.login-box{background:white;padding:40px;border-radius:16px;width:100%;max-width:400px;}
h2{text-align:center;margin-bottom:30px;}
.form-group{margin-bottom:20px;}
label{display:block;margin-bottom:8px;font-weight:500;}
input{width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;font-size:14px;}
input:focus{outline:none;border-color:#667eea;}
button{width:100%;padding:12px;background:#667eea;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px;}
button:hover{background:#5a67d8;}
.back-link{text-align:center;margin-top:20px;}
.back-link a{color:#667eea;text-decoration:none;}
</style>
</head>
<body>
<div class="login-box">
<h2>🔐 管理员登录</h2>
<form method="post" action="/admin">
<div class="form-group"><label>账号</label><input type="text" name="username" required autofocus></div>
<div class="form-group"><label>密码</label><input type="password" name="password" required></div>
<button type="submit">登录</button>
</form>
<div class="back-link"><a href="/">← 返回首页</a></div>
</div>
</body></html>`, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }
    
    // 已登录 - 显示完整后台管理页面
    return new Response(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>书签管理后台</title>
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:system-ui,sans-serif;background:#f5f5f5;padding:20px}
        .container{max-width:1200px;margin:0 auto}
        .header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:20px;border-radius:12px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center}
        .card{background:white;border-radius:12px;padding:20px;margin-bottom:20px;box-shadow:0 2px 4px rgba(0,0,0,0.1)}
        .card h2{margin-bottom:15px;border-left:4px solid #667eea;padding-left:15px}
        .form-group{margin-bottom:15px}
        .form-group label{display:block;margin-bottom:5px;font-weight:500}
        .form-group input,.form-group textarea{width:100%;padding:10px;border:1px solid #ddd;border-radius:6px}
        button{background:#667eea;color:white;border:none;padding:10px 20px;border-radius:6px;cursor:pointer}
        .btn-danger{background:#e53e3e}
        .btn-success{background:#38a169}
        .btn-warning{background:#ed8936}
        table{width:100%;border-collapse:collapse}
        th,td{padding:10px;text-align:left;border-bottom:1px solid #ddd}
        th{background:#f7fafc}
        .actions{display:flex;gap:8px}
        .message{padding:10px;border-radius:6px;margin-bottom:15px;display:none}
        .message.success{background:#d4edda;color:#155724}
        .message.error{background:#f8d7da;color:#721c24}
        .modal{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;justify-content:center;align-items:center}
        .modal-content{background:white;border-radius:12px;padding:24px;width:90%;max-width:500px;max-height:80vh;overflow-y:auto}
        .modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
        .close-modal{font-size:24px;cursor:pointer;color:#999}
        .form-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:20px}
        .logo-section{background:#f7fafc;padding:15px;border-radius:8px;margin-bottom:20px}
        .logo-preview{display:flex;align-items:center;gap:15px;flex-wrap:wrap}
        .logo-preview img{max-width:200px;max-height:240px;width:auto;height:auto;object-fit:contain}
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>📚 书签管理后台</h1>
        <form method="post" action="/logout"><button type="submit" style="background:rgba(255,255,255,0.2)">退出登录</button></form>
    </div>
    
    <div class="card">
        <h2>🖼️ Logo 设置</h2>
        <div class="logo-section">
            <div class="logo-preview">
                <span>当前Logo：</span>
                <img id="logoPreview" style="max-width:200px; max-height:240px; width:auto; height:auto; object-fit:contain; display:none">
                <span id="noLogoHint" style="color:#999">未设置</span>
            </div>
            <div style="display:flex; gap:10px; margin-top:15px; flex-wrap:wrap">
                <input type="text" id="logoInput" placeholder="Logo图片URL" style="flex:1; padding:8px; border:1px solid #ddd; border-radius:6px; min-width:200px">
                <button id="saveLogoBtn" style="background:#38a169">保存Logo</button>
            </div>
            <div style="display:flex; gap:10px; margin-top:10px; flex-wrap:wrap">
                <input type="text" id="logoLinkInput" placeholder="Logo点击链接（留空则不可点击）" style="flex:1; padding:8px; border:1px solid #ddd; border-radius:6px; min-width:200px">
                <button id="saveLogoLinkBtn" style="background:#38a169">保存链接</button>
            </div>
        </div>
    </div>
    
    <div class="card">
        <h2>➕ 添加书签</h2>
        <form id="addForm">
            <div class="form-group"><label>名称 *</label><input type="text" id="name" required></div>
            <div class="form-group"><label>网址 *</label><input type="url" id="url" required></div>
            <div class="form-group"><label>分类 *</label><input type="text" id="catelog" required></div>
            <div class="form-group"><label>Logo URL</label><input type="url" id="logo"></div>
            <div class="form-group"><label>描述</label><textarea id="desc" rows="2"></textarea></div>
            <div class="form-group"><label>排序</label><input type="number" id="sort_order" value="9999"></div>
            <button type="submit" class="btn-success">添加书签</button>
        </form>
    </div>
    
    <div class="card">
        <h2>📋 书签列表</h2>
        <div id="message" class="message"></div>
        <div style="overflow-x:auto">\n <thead>\n <tr><th>ID</th><th>名称</th><th>网址</th><th>分类</th><th>排序</th><th>操作</th></tr>\n </thead>\n <tbody id="sitesList"></tbody>\n </div>
    </div>
</div>

<div id="editModal" class="modal">
    <div class="modal-content">
        <div class="modal-header"><h3>✏️ 编辑书签</h3><span class="close-modal">&times;</span></div>
        <form id="editForm">
            <input type="hidden" id="edit_id">
            <div class="form-group"><label>名称 *</label><input type="text" id="edit_name" required></div>
            <div class="form-group"><label>网址 *</label><input type="url" id="edit_url" required></div>
            <div class="form-group"><label>分类 *</label><input type="text" id="edit_catelog" required></div>
            <div class="form-group"><label>Logo URL</label><input type="url" id="edit_logo"></div>
            <div class="form-group"><label>描述</label><textarea id="edit_desc" rows="2"></textarea></div>
            <div class="form-group"><label>排序</label><input type="number" id="edit_sort_order" value="9999"></div>
            <div class="form-actions"><button type="button" class="close-modal-btn" style="background:#a0aec0">取消</button><button type="submit" class="btn-success">保存修改</button></div>
        </form>
    </div>
</div>

<script>
    async function loadLogo() {
        const res = await fetch('/api/logo');
        const data = await res.json();
        if (data.code === 200 && data.logo) {
            document.getElementById('logoPreview').src = data.logo;
            document.getElementById('logoPreview').style.display = 'block';
            document.getElementById('noLogoHint').style.display = 'none';
        }
    }
    async function loadLogoLink() {
        const res = await fetch('/api/logo-link');
        const data = await res.json();
        if (data.code === 200 && data.link) {
            document.getElementById('logoLinkInput').value = data.link;
        }
    }
    async function loadSites() {
        const res = await fetch('/api/config');
        const data = await res.json();
        if (data.code === 200) {
            const tbody = document.getElementById('sitesList');
            tbody.innerHTML = '';
            data.data.forEach(site => {
                const row = tbody.insertRow();
                row.insertCell(0).textContent = site.id;
                row.insertCell(1).innerHTML = '<strong>' + escapeHtml(site.name) + '</strong>';
                row.insertCell(2).innerHTML = '<a href="' + site.url + '" target="_blank">' + (site.url || '').substring(0,40) + '</a>';
                row.insertCell(3).innerHTML = '<span style="background:#e2e8f0;padding:2px 8px;border-radius:4px">' + escapeHtml(site.catelog) + '</span>';
                row.insertCell(4).textContent = site.sort_order === 9999 ? '默认' : site.sort_order;
                const actions = row.insertCell(5);
                actions.className = 'actions';
                const editBtn = document.createElement('button');
                editBtn.textContent = '编辑';
                editBtn.className = 'btn-warning';
                editBtn.onclick = () => openEditModal(site);
                actions.appendChild(editBtn);
                const delBtn = document.createElement('button');
                delBtn.textContent = '删除';
                delBtn.className = 'btn-danger';
                delBtn.onclick = () => deleteSite(site.id);
                actions.appendChild(delBtn);
            });
        }
    }
    function openEditModal(site) {
        document.getElementById('edit_id').value = site.id;
        document.getElementById('edit_name').value = site.name || '';
        document.getElementById('edit_url').value = site.url || '';
        document.getElementById('edit_catelog').value = site.catelog || '';
        document.getElementById('edit_logo').value = site.logo || '';
        document.getElementById('edit_desc').value = site.desc || '';
        document.getElementById('edit_sort_order').value = site.sort_order || 9999;
        document.getElementById('editModal').style.display = 'flex';
    }
    function closeModal() { document.getElementById('editModal').style.display = 'none'; }
    async function deleteSite(id) {
        if (!confirm('确定删除？')) return;
        const res = await fetch('/api/config/' + id, { method: 'DELETE' });
        const data = await res.json();
        if (data.code === 200) { showMessage('删除成功', 'success'); loadSites(); }
        else showMessage('删除失败', 'error');
    }
    function showMessage(msg, type) {
        const msgDiv = document.getElementById('message');
        msgDiv.textContent = msg;
        msgDiv.className = 'message ' + type;
        msgDiv.style.display = 'block';
        setTimeout(() => msgDiv.style.display = 'none', 3000);
    }
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
    document.getElementById('addForm').onsubmit = async (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('name').value.trim(),
            url: document.getElementById('url').value.trim(),
            catelog: document.getElementById('catelog').value.trim(),
            logo: document.getElementById('logo').value.trim(),
            desc: document.getElementById('desc').value.trim(),
            sort_order: parseInt(document.getElementById('sort_order').value) || 9999
        };
        if (!data.name || !data.url || !data.catelog) { showMessage('请填写完整', 'error'); return; }
        const res = await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const result = await res.json();
        if (result.code === 201) { showMessage('添加成功', 'success'); document.getElementById('addForm').reset(); document.getElementById('sort_order').value = '9999'; loadSites(); }
        else showMessage('添加失败', 'error');
    };
    document.getElementById('editForm').onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit_id').value;
        const data = {
            name: document.getElementById('edit_name').value.trim(),
            url: document.getElementById('edit_url').value.trim(),
            catelog: document.getElementById('edit_catelog').value.trim(),
            logo: document.getElementById('edit_logo').value.trim(),
            desc: document.getElementById('edit_desc').value.trim(),
            sort_order: parseInt(document.getElementById('edit_sort_order').value) || 9999
        };
        if (!data.name || !data.url || !data.catelog) { showMessage('请填写完整', 'error'); return; }
        const res = await fetch('/api/config/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const result = await res.json();
        if (result.code === 200) { showMessage('修改成功', 'success'); closeModal(); loadSites(); }
        else showMessage('修改失败', 'error');
    };
    document.getElementById('saveLogoBtn').onclick = async () => {
        const logoUrl = document.getElementById('logoInput').value.trim();
        const res = await fetch('/api/logo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logo: logoUrl }) });
        const data = await res.json();
        if (data.code === 200) {
            showMessage('Logo保存成功', 'success');
            if (logoUrl) {
                document.getElementById('logoPreview').src = logoUrl;
                document.getElementById('logoPreview').style.display = 'block';
                document.getElementById('noLogoHint').style.display = 'none';
            } else {
                document.getElementById('logoPreview').style.display = 'none';
                document.getElementById('noLogoHint').style.display = 'inline';
            }
        } else { showMessage('保存失败', 'error'); }
    };
    document.getElementById('saveLogoLinkBtn').onclick = async () => {
        const linkUrl = document.getElementById('logoLinkInput').value.trim();
        const res = await fetch('/api/logo-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ link: linkUrl }) });
        const data = await res.json();
        if (data.code === 200) { showMessage('链接保存成功', 'success'); }
        else { showMessage('保存失败', 'error'); }
    };
    document.querySelector('.close-modal').onclick = closeModal;
    document.querySelector('.close-modal-btn').onclick = closeModal;
    window.onclick = (e) => { if (e.target === document.getElementById('editModal')) closeModal(); };
    loadLogo(); loadLogoLink(); loadSites();
</script>
</body>
</html>`, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

export async function onRequestPost({ request, env }) {
    const form = await request.formData();
    const username = form.get('username');
    const password = form.get('password');
    
    const adminUser = await NAV_KV.get('admin_username') || 'admin';
    const adminPass = await NAV_KV.get('admin_password') || 'admin123';
    
    if (username === adminUser && password === adminPass) {
        const token = crypto.randomUUID();
        await NAV_KV.put(`session:${token}`, 'active', { expirationTtl: 86400 });
        
        return new Response(null, {
            status: 302,
            headers: {
                'Location': '/admin',
                'Set-Cookie': `admin_token=${token}; Path=/; HttpOnly; Max-Age=86400`
            }
        });
    }
    return new Response('密码错误，<a href="/admin">返回</a>', {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}
