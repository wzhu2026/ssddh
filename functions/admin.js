// functions/admin.js - 修复版
export async function onRequest({ request, env }) {
    const cookie = request.headers.get('Cookie') || '';
    const match = cookie.match(/admin_token=([^;]+)/);
    let isLoggedIn = false;
    
    if (match) {
        const session = await NAV_KV.get(`session:${match[1]}`);
        isLoggedIn = session !== null;
    }
    
    // 处理登录 POST
    if (request.method === 'POST') {
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
    
    // 未登录显示登录页
    if (!isLoggedIn) {
        return new Response(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>登录后台</title>
<style>
body{font-family:system-ui;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;display:flex;justify-content:center;align-items:center;}
.login-box{background:white;padding:40px;border-radius:16px;width:100%;max-width:400px;}
h2{text-align:center;margin-bottom:30px;}
input{width:100%;padding:12px;margin:10px 0;border:1px solid #ddd;border-radius:8px;}
button{width:100%;padding:12px;background:#667eea;color:white;border:none;border-radius:8px;cursor:pointer;}
</style>
</head>
<body>
<div class="login-box">
<h2>🔐 管理员登录</h2>
<form method="post">
<input type="text" name="username" placeholder="账号" required>
<input type="password" name="password" placeholder="密码" required>
<button type="submit">登录</button>
</form>
<p style="text-align:center;margin-top:20px;"><a href="/">返回首页</a></p>
</div>
</body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    
    // 已登录显示后台 - 修复了元素 ID
    return new Response(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>后台管理</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:system-ui;background:#f5f5f5;padding:20px;}
.container{max-width:1000px;margin:0 auto;}
.header{background:#667eea;color:white;padding:15px;border-radius:10px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;}
.card{background:white;border-radius:10px;padding:20px;margin-bottom:20px;box-shadow:0 1px 3px rgba(0,0,0,0.1);}
.card h3{margin-bottom:15px;}
input{width:100%;padding:10px;margin:5px 0 15px;border:1px solid #ddd;border-radius:5px;}
button{background:#667eea;color:white;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;}
table{width:100%;border-collapse:collapse;}
th,td{padding:10px;text-align:left;border-bottom:1px solid #eee;}
.msg{padding:10px;margin-bottom:15px;border-radius:5px;display:none;}
.msg.success{background:#d4edda;color:#155724;}
.msg.error{background:#f8d7da;color:#721c24;}
</style>
</head>
<body>
<div class="container">
<div class="header">
<h2>📚 书签管理后台</h2>
<form method="post" action="/logout"><button type="submit">退出登录</button></form>
</div>
<div class="card">
<h3>➕ 添加书签</h3>
<div id="addMsg" class="msg"></div>
<form id="addForm">
<input type="text" id="name" placeholder="名称" required>
<input type="url" id="url" placeholder="网址" required>
<input type="text" id="catelog" placeholder="分类">
<button type="submit">添加书签</button>
</form>
</div>
<div class="card">
<h3>📋 书签列表</h3>
<div id="listMsg" class="msg"></div>
<div id="listContainer"></div>
</div>
</div>
<script>
async function loadSites() {
    try {
        const res = await fetch('/api/config');
        const data = await res.json();
        if (data.code === 200) {
            const container = document.getElementById('listContainer');
            if (!container) return;
            
            if (data.data.length === 0) {
                container.innerHTML = '<p style="text-align:center;padding:40px;color:#888;">暂无书签，请添加</p>';
                return;
            }
            
            let html = '<table style="width:100%"><thead><tr><th>名称</th><th>网址</th><th>分类</th><th>操作</th></tr></thead><tbody>';
            for (const site of data.data) {
                html += \`
                    <tr>
                        <td><strong>\${escapeHtml(site.name)}</strong></td>
                        <td><a href="\${site.url}" target="_blank">\${site.url.substring(0,40)}</a></td>
                        <td>\${escapeHtml(site.catelog || '未分类')}</td>
                        <td><button class="delete-btn" data-id="\${site.id}" style="background:#e53e3e;color:white;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">删除</button></td>
                    </tr>
                \`;
            }
            html += '</tbody></table>';
            container.innerHTML = html;
            
            // 绑定删除事件
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.onclick = async () => {
                    const id = btn.dataset.id;
                    if (confirm('确定删除？')) {
                        const res = await fetch('/api/config/' + id, { method: 'DELETE' });
                        const result = await res.json();
                        if (result.code === 200) {
                            showMsg('listMsg', '删除成功', 'success');
                            loadSites();
                        } else {
                            showMsg('listMsg', '删除失败', 'error');
                        }
                    }
                };
            });
        }
    } catch (e) {
        console.error('加载失败:', e);
        showMsg('listMsg', '加载失败', 'error');
    }
}

function showMsg(elementId, msg, type) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = msg;
        el.className = 'msg ' + type;
        el.style.display = 'block';
        setTimeout(() => el.style.display = 'none', 3000);
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : m === '>' ? '&gt;' : m);
}

// 添加书签
document.getElementById('addForm').onsubmit = async (e) => {
    e.preventDefault();
    const data = {
        name: document.getElementById('name').value.trim(),
        url: document.getElementById('url').value.trim(),
        catelog: document.getElementById('catelog').value.trim()
    };
    if (!data.name || !data.url) {
        showMsg('addMsg', '请填写名称和网址', 'error');
        return;
    }
    try {
        const res = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.code === 201) {
            showMsg('addMsg', '添加成功', 'success');
            document.getElementById('addForm').reset();
            loadSites();
        } else {
            showMsg('addMsg', '添加失败: ' + result.message, 'error');
        }
    } catch (e) {
        showMsg('addMsg', '添加失败', 'error');
    }
};

// 初始化
loadSites();
</script>
</body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
