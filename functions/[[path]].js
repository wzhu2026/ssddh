// functions/[[path]].js - 单文件完整版
export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // ========== 工具函数 ==========
    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
    
    function sanitizeUrl(url) {
        if (!url) return '';
        let u = String(url).trim();
        if (!u.startsWith('http://') && !u.startsWith('https://')) {
            u = 'https://' + u;
        }
        return u;
    }
    
    function parseCookies(cookieHeader) {
        const cookies = {};
        if (!cookieHeader) return cookies;
        cookieHeader.split(';').forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            if (name) cookies[name] = value || '';
        });
        return cookies;
    }
    
    // ========== KV 操作 ==========
    async function getSites() {
        try {
            const data = await NAV_KV.get('sites');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }
    
    async function addSite(site) {
        const sites = await getSites();
        const newId = sites.length ? Math.max(...sites.map(s => s.id)) + 1 : 1;
        sites.unshift({ id: newId, ...site });
        await NAV_KV.put('sites', JSON.stringify(sites));
        return newId;
    }
    
    async function updateSite(id, data) {
        const sites = await getSites();
        const index = sites.findIndex(s => s.id == id);
        if (index === -1) return false;
        sites[index] = { ...sites[index], ...data };
        await NAV_KV.put('sites', JSON.stringify(sites));
        return true;
    }
    
    async function deleteSite(id) {
        const sites = await getSites();
        const newSites = sites.filter(s => s.id != id);
        await NAV_KV.put('sites', JSON.stringify(newSites));
        return true;
    }
    
    async function getLogo() {
        try {
            return await NAV_KV.get('site_logo') || '';
        } catch (e) {
            return '';
        }
    }
    
    async function setLogo(logo) {
        if (logo) {
            await NAV_KV.put('site_logo', logo);
        } else {
            await NAV_KV.delete('site_logo');
        }
    }
    
    async function getLogoLink() {
        try {
            return await NAV_KV.get('site_logo_link') || '';
        } catch (e) {
            return '';
        }
    }
    
    async function setLogoLink(link) {
        if (link) {
            await NAV_KV.put('site_logo_link', link);
        } else {
            await NAV_KV.delete('site_logo_link');
        }
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
            const { name, url: siteUrl, catelog, logo, desc, sort_order } = body;
            if (!name || !siteUrl) {
                return new Response(JSON.stringify({ code: 400, message: '缺少必要字段' }));
            }
            await addSite({ name, url: siteUrl, catelog: catelog || '未分类', logo, desc, sort_order: sort_order || 9999 });
            return new Response(JSON.stringify({ code: 201, message: '创建成功' }));
        } catch (e) {
            return new Response(JSON.stringify({ code: 500, message: e.message }));
        }
    }
    
    // PUT /api/config/:id
    if (pathname.match(/^\/api\/config\/\d+$/) && request.method === 'PUT') {
        const id = parseInt(pathname.split('/').pop());
        try {
            const body = await request.json();
            await updateSite(id, body);
            return new Response(JSON.stringify({ code: 200, message: '更新成功' }));
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
    
    // GET /api/logo
    if (pathname === '/api/logo' && request.method === 'GET') {
        const logo = await getLogo();
        return new Response(JSON.stringify({ code: 200, logo }));
    }
    
    // POST /api/logo
    if (pathname === '/api/logo' && request.method === 'POST') {
        const body = await request.json();
        await setLogo(body.logo || '');
        return new Response(JSON.stringify({ code: 200, message: '保存成功' }));
    }
    
    // GET /api/logo-link
    if (pathname === '/api/logo-link' && request.method === 'GET') {
        const link = await getLogoLink();
        return new Response(JSON.stringify({ code: 200, link }));
    }
    
    // POST /api/logo-link
    if (pathname === '/api/logo-link' && request.method === 'POST') {
        const body = await request.json();
        await setLogoLink(body.link || '');
        return new Response(JSON.stringify({ code: 200, message: '保存成功' }));
    }
    
    // ========== 退出登录 ==========
    if (pathname === '/logout' && request.method === 'POST') {
        const cookie = request.headers.get('Cookie') || '';
        const match = cookie.match(/admin_token=([^;]+)/);
        if (match) {
            await NAV_KV.delete(`session:${match[1]}`);
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
        // POST 登录
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
        
        // GET 检查登录
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
.container{max-width:1200px;margin:0 auto;}
.header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:20px;border-radius:12px;margin-bottom:20px;display:flex;justify-content:space-between;}
.card{background:white;border-radius:12px;padding:20px;margin-bottom:20px;box-shadow:0 2px 4px rgba(0,0,0,0.1);}
.card h2{margin-bottom:15px;border-left:4px solid #667eea;padding-left:15px;}
.form-group{margin-bottom:15px;}
.form-group label{display:block;margin-bottom:5px;}
.form-group input,.form-group textarea{width:100%;padding:10px;border:1px solid #ddd;border-radius:6px;}
button{background:#667eea;color:white;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;}
.btn-success{background:#38a169;}
table{width:100%;border-collapse:collapse;}
th,td{padding:10px;text-align:left;border-bottom:1px solid #ddd;}
.message{padding:10px;border-radius:6px;margin-bottom:15px;display:none;}
.message.success{background:#d4edda;color:#155724;}
</style>
</head>
<body>
<div class="container">
<div class="header"><h1>📚 书签管理后台</h1><form method="post" action="/logout"><button type="submit">退出登录</button></form></div>
<div class="card"><h2>➕ 添加书签</h2><form id="addForm"><div class="form-group"><label>名称</label><input type="text" id="name" required></div><div class="form-group"><label>网址</label><input type="url" id="url" required></div><div class="form-group"><label>分类</label><input type="text" id="catelog"></div><div class="form-group"><label>Logo URL</label><input type="url" id="logo"></div><div class="form-group"><label>描述</label><textarea id="desc" rows="2"></textarea></div><button type="submit" class="btn-success">添加书签</button></form><div id="msg"></div></div>
<div class="card"><h2>📋 书签列表</h2><div id="list"></div></div>
</div>
<script>
async function load(){const r=await fetch('/api/config'),d=await r.json();if(d.code===200){const h=document.getElementById('list');h.innerHTML='<table><thead><tr><th>名称</th><th>网址</th><th>分类</th><th>操作</th></tr></thead><tbody id="tbody"></tbody></table>';const t=document.getElementById('tbody');t.innerHTML='';d.data.forEach(s=>{const r=t.insertRow();r.insertCell(0).innerHTML='<strong>'+escapeHtml(s.name)+'</strong>';r.insertCell(1).innerHTML='<a href="'+s.url+'" target="_blank">'+s.url.substring(0,40)+'</a>';r.insertCell(2).innerHTML=escapeHtml(s.catelog||'未分类');const a=r.insertCell(3),d=document.createElement('button');d.textContent='删除';d.onclick=()=>deleteSite(s.id);a.appendChild(d);})}}
async function deleteSite(id){if(confirm('确定删除？')){await fetch('/api/config/'+id,{method:'DELETE'});load();}}
function escapeHtml(s){if(!s)return '';return s.replace(/[&<>]/g,m=>m==='&'?'&amp;':m==='<'?'&lt;':m==='>'?'&gt;':m);}
document.getElementById('addForm').onsubmit=async e=>{e.preventDefault();const data={name:document.getElementById('name').value,url:document.getElementById('url').value,catelog:document.getElementById('catelog').value,logo:document.getElementById('logo').value,desc:document.getElementById('desc').value};const r=await fetch('/api/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const d=await r.json();if(d.code===201){document.getElementById('addForm').reset();load();document.getElementById('msg').innerHTML='<span style="color:green;">添加成功</span>';setTimeout(()=>document.getElementById('msg').innerHTML='',2000);}else{document.getElementById('msg').innerHTML='<span style="color:red;">添加失败</span>';}};
load();
</script>
</body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    
    // ========== 首页 ==========
    const sites = await getSites();
    const logo = await getLogo();
    const logoLink = await getLogoLink();
    
    // 获取分类
    const categories = [...new Set(sites.map(s => s.catelog || '未分类'))];
    const currentCat = url.searchParams.get('c') || '';
    const filteredSites = currentCat ? sites.filter(s => (s.catelog || '未分类') === currentCat) : sites;
    
    // 侧边栏
    let catHtml = '';
    for (const cat of categories) {
        const count = sites.filter(s => (s.catelog || '未分类') === cat).length;
        const active = currentCat === cat ? 'background:#e2e8f0;color:#667eea;font-weight:600;' : '';
        catHtml += `<a href="/?c=${encodeURIComponent(cat)}" style="display:block;padding:10px 12px;margin:4px 0;border-radius:8px;text-decoration:none;color:#4a5568;${active}">📁 ${escapeHtml(cat)} <span style="float:right;">${count}</span></a>`;
    }
    
    // 卡片
    let cardsHtml = '';
    for (const site of filteredSites) {
        const initial = (site.name && site.name[0]) || '站';
        cardsHtml += `
            <div style="background:white;border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                <a href="${sanitizeUrl(site.url)}" target="_blank" style="text-decoration:none;color:inherit;">
                    <div style="display:flex;align-items:center;">
                        <div style="width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;margin-right:14px;">${escapeHtml(initial)}</div>
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
    
    let logoHtml = '';
    if (logo) {
        logoHtml = logoLink ? `<a href="${escapeHtml(logoLink)}" target="_blank"><img src="${escapeHtml(logo)}" style="max-width:200px;max-height:240px;"></a>` : `<img src="${escapeHtml(logo)}" style="max-width:200px;max-height:240px;">`;
    } else {
        logoHtml = '<div style="font-size:28px;font-weight:bold;">旭儿导航</div>';
    }
    
    return new Response(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>朱氏家族门户</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:system-ui;background:#f7fafc;}
.sidebar{position:fixed;left:0;top:0;width:280px;height:100vh;background:white;overflow-y:auto;z-index:100;transition:transform 0.3s;}
.sidebar-header{padding:20px;text-align:center;border-bottom:1px solid #e2e8f0;}
.sidebar-nav{padding:20px;}
.main{margin-left:280px;}
.header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:50px;text-align:center;}
.header h1{font-size:60px;}
.content{max-width:1300px;margin:0 auto;padding:35px 30px;}
.sites-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:20px;}
.mobile-toggle{display:none;position:fixed;top:15px;left:15px;z-index:101;background:white;border:none;padding:10px;border-radius:10px;cursor:pointer;}
@media (max-width:768px){
.sidebar{transform:translateX(-100%);}
.sidebar.open{transform:translateX(0);}
.main{margin-left:0;}
.mobile-toggle{display:block;}
.header h1{font-size:28px;}
.sites-grid{grid-template-columns:1fr;}
}
</style>
</head>
<body>
<button class="mobile-toggle" id="mobileToggle">☰</button>
<div class="sidebar" id="sidebar">
<div class="sidebar-header">${logoHtml}</div>
<div class="sidebar-nav">
<a href="/" style="display:block;padding:10px;margin-bottom:8px;background:#e2e8f0;border-radius:8px;text-align:center;text-decoration:none;color:#667eea;">🏠 全部网站</a>
${catHtml}
<div style="margin-top:25px;"><a href="/admin" style="display:block;padding:10px;background:#edf2f7;border-radius:8px;text-align:center;text-decoration:none;color:#4a5568;">⚙️ 后台管理</a></div>
</div>
</div>
<div class="main">
<div class="header"><h1>朱氏家族门户</h1><p>虚拟世界 · 无限可能 · 探索世界 · 充实人生</p></div>
<div class="content"><div class="sites-grid">${cardsHtml}</div></div>
</div>
<script>
document.getElementById('mobileToggle').onclick=()=>document.getElementById('sidebar').classList.toggle('open');
</script>
</body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
