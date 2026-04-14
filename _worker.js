// _worker.js - 统一处理所有请求
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const pathname = url.pathname;
        
        // ========== 工具函数 ==========
        function escapeHtml(str) {
            if (!str) return '';
            return String(str).replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : m === '>' ? '&gt;' : m);
        }
        
        // ========== KV 操作 ==========
        async function getSites() {
            try {
                const data = await env.NAV_KV.get('sites');
                return data ? JSON.parse(data) : [];
            } catch (e) {
                return [];
            }
        }
        
        async function addSite(site) {
            const sites = await getSites();
            const newId = sites.length ? Math.max(...sites.map(s => s.id)) + 1 : 1;
            sites.unshift({ id: newId, ...site });
            await env.NAV_KV.put('sites', JSON.stringify(sites));
            return newId;
        }
        
        async function deleteSite(id) {
            const sites = await getSites();
            const newSites = sites.filter(s => s.id != id);
            await env.NAV_KV.put('sites', JSON.stringify(newSites));
            return true;
        }
        
        // ========== API 路由 ==========
        // GET /api/config
        if (pathname === '/api/config' && request.method === 'GET') {
            const sites = await getSites();
            return new Response(JSON.stringify({ code: 200, data: sites }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // POST /api/config
        if (pathname === '/api/config' && request.method === 'POST') {
            try {
                const body = await request.json();
                const { name, url: siteUrl, catelog } = body;
                await addSite({ name, url: siteUrl, catelog: catelog || '未分类' });
                return new Response(JSON.stringify({ code: 201, message: '创建成功' }));
            } catch (e) {
                return new Response(JSON.stringify({ code: 500, message: e.message }));
            }
        }
        
        // DELETE /api/config/:id
        if (pathname.match(/^\/api\/config\/\d+$/) && request.method === 'DELETE') {
            const id = parseInt(pathname.split('/').pop());
            await deleteSite(id);
            return new Response(JSON.stringify({ code: 200, message: '删除成功' }));
        }
        
        // ========== 退出登录 ==========
        if (pathname === '/logout' && request.method === 'POST') {
            const cookie = request.headers.get('Cookie') || '';
            const match = cookie.match(/admin_token=([^;]+)/);
            if (match) {
                await env.NAV_KV.delete(`session:${match[1]}`);
            }
            return new Response(null, {
                status: 302,
                headers: {
                    'Location': '/',
                    'Set-Cookie': 'admin_token=; Path=/; Max-Age=0'
                }
            });
        }
        
        // ========== 后台管理 ==========
        if (pathname === '/admin') {
            // 处理登录 POST
            if (request.method === 'POST') {
                const form = await request.formData();
                const username = form.get('username');
                const password = form.get('password');
                
                const adminUser = await env.NAV_KV.get('admin_username') || 'admin';
                const adminPass = await env.NAV_KV.get('admin_password') || 'admin123';
                
                if (username === adminUser && password === adminPass) {
                    const token = crypto.randomUUID();
                    await env.NAV_KV.put(`session:${token}`, 'active', { expirationTtl: 86400 });
                    
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
            
            // 检查登录状态
            const cookie = request.headers.get('Cookie') || '';
            const match = cookie.match(/admin_token=([^;]+)/);
            let isLoggedIn = false;
            
            if (match) {
                const session = await env.NAV_KV.get(`session:${match[1]}`);
                isLoggedIn = session !== null;
            }
            
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
            
            // 显示后台管理页面
            return new Response(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>后台管理</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:system-ui;background:#f5f5f5;padding:20px;}
.container{max-width:1000px;margin:0 auto;}
.header{background:#667eea;color:white;padding:15px;border-radius:10px;margin-bottom:20px;display:flex;justify-content:space-between;}
.card{background:white;border-radius:10px;padding:20px;margin-bottom:20px;}
input{width:100%;padding:10px;margin:5px 0 15px;border:1px solid #ddd;border-radius:5px;}
button{background:#667eea;color:white;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;}
table{width:100%;border-collapse:collapse;}
th,td{padding:10px;border-bottom:1px solid #eee;}
</style>
</head>
<body>
<div class="container">
<div class="header"><h2>书签管理后台</h2><form method="post" action="/logout"><button type="submit">退出登录</button></form></div>
<div class="card"><h3>添加书签</h3><form id="addForm"><input type="text" id="name" placeholder="名称" required><input type="url" id="url" placeholder="网址" required><input type="text" id="catelog" placeholder="分类"><button type="submit">添加</button></form><div id="msg"></div></div>
<div class="card"><h3>书签列表</h3><div id="list"></div></div>
</div>
<script>
async function load(){const r=await fetch('/api/config'),d=await r.json();if(d.code===200){const h=document.getElementById('list');h.innerHTML='<table><thead><tr><th>名称</th><th>网址</th><th>分类</th><th>操作</th></tr></thead><tbody id="tbody"></tbody></table>';const t=document.getElementById('tbody');t.innerHTML='';d.data.forEach(s=>{const r=t.insertRow();r.insertCell(0).innerHTML='<strong>'+escapeHtml(s.name)+'</strong>';r.insertCell(1).innerHTML='<a href="'+s.url+'" target="_blank">'+s.url.substring(0,40)+'</a>';r.insertCell(2).innerHTML=escapeHtml(s.catelog||'未分类');const a=r.insertCell(3),d=document.createElement('button');d.textContent='删除';d.onclick=()=>deleteSite(s.id);a.appendChild(d);})}}
async function deleteSite(id){if(confirm('确定删除？')){await fetch('/api/config/'+id,{method:'DELETE'});load();}}
function escapeHtml(s){if(!s)return '';return s.replace(/[&<>]/g,m=>m==='&'?'&amp;':m==='<'?'&lt;':m==='>'?'&gt;':m);}
document.getElementById('addForm').onsubmit=async e=>{e.preventDefault();const data={name:document.getElementById('name').value,url:document.getElementById('url').value,catelog:document.getElementById('catelog').value};const r=await fetch('/api/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const d=await r.json();if(d.code===201){document.getElementById('addForm').reset();load();document.getElementById('msg').innerHTML='<span style="color:green;">添加成功</span>';setTimeout(()=>document.getElementById('msg').innerHTML='',2000);}else{document.getElementById('msg').innerHTML='<span style="color:red;">添加失败</span>';}};
load();
</script>
</body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }
        
        // ========== 首页 ==========
        const sites = await getSites();
        
        let cardsHtml = '';
        for (const site of sites) {
            cardsHtml += `
                <div style="background:white;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                    <a href="${site.url}" target="_blank" style="text-decoration:none;color:inherit;">
                        <div style="display:flex;align-items:center;">
                            <div style="width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;margin-right:14px;">${escapeHtml(site.name[0] || '站')}</div>
                            <div><h3 style="font-size:16px;">${escapeHtml(site.name)}</h3><span style="font-size:12px;color:#888;">${escapeHtml(site.catelog || '未分类')}</span></div>
                        </div>
                        <p style="font-size:13px;color:#666;margin-top:10px;">${escapeHtml(site.desc || '暂无描述')}</p>
                    </a>
                </div>
            `;
        }
        
        if (!cardsHtml) {
            cardsHtml = '<div style="text-align:center;padding:60px;">暂无书签，请登录后台添加</div>';
        }
        
        return new Response(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>我的导航</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:system-ui;background:#f7fafc;padding:20px;}
.container{max-width:800px;margin:0 auto;}
h1{text-align:center;margin-bottom:30px;}
.admin-link{display:block;text-align:center;margin-top:30px;color:#667eea;}
</style>
</head>
<body>
<div class="container">
<h1>📚 我的导航</h1>
${cardsHtml}
<a href="/admin" class="admin-link">⚙️ 管理后台</a>
</div>
</body></html>`, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }
};
