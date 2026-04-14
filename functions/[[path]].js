// functions/[[path]].js - EdgeOne Pages 标准格式
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
    if (pathname === '/api/sites' && request.method === 'GET') {
        const sites = await getSites();
        return new Response(JSON.stringify({ success: true, data: sites }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    if (pathname === '/api/sites' && request.method === 'POST') {
        try {
            const body = await request.json();
            const { name, url: siteUrl, catelog } = body;
            if (!name || !siteUrl) {
                return new Response(JSON.stringify({ success: false, message: '名称和网址不能为空' }));
            }
            await addSite({ name, url: siteUrl, catelog: catelog || '未分类' });
            return new Response(JSON.stringify({ success: true, message: '添加成功' }));
        } catch (e) {
            return new Response(JSON.stringify({ success: false, message: e.message }));
        }
    }
    
    if (pathname.match(/^\/api\/sites\/\d+$/) && request.method === 'DELETE') {
        const id = parseInt(pathname.split('/').pop());
        await deleteSite(id);
        return new Response(JSON.stringify({ success: true, message: '删除成功' }));
    }
    
    // ========== 退出登录 ==========
    if (pathname === '/logout') {
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
        const cookies = parseCookies(request.headers.get('Cookie') || '');
        const token = cookies['admin_token'];
        let isLoggedIn = false;
        
        if (token) {
            const session = await env.NAV_KV.get(`session:${token}`);
            isLoggedIn = session !== null;
        }
        
        if (!isLoggedIn) {
            return new Response(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>登录后台</title>
<style>
body{font-family:system-ui;max-width:400px;margin:100px auto;padding:20px;}
input{width:100%;padding:10px;margin:10px 0;border:1px solid #ddd;border-radius:5px;}
button{width:100%;padding:10px;background:#667eea;color:white;border:none;border-radius:5px;cursor:pointer;}
</style>
</head>
<body>
<h1>登录后台</h1>
<form method="post">
<input name="username" placeholder="账号">
<input name="password" type="password" placeholder="密码">
<button type="submit">登录</button>
</form>
<p>默认账号: admin / admin123</p>
<a href="/">返回首页</a>
</body></html>`, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
        }
        
        // 显示后台管理页面
        return new Response(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>后台管理</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:system-ui;background:#f5f5f5;padding:20px;}
.container{max-width:1000px;margin:0 auto;}
.header{background:#667eea;color:white;padding:15px;border-radius:10px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;}
.card{background:white;border-radius:10px;padding:20px;margin-bottom:20px;box-shadow:0 1px 3px rgba(0,0,0,0.1);}
.card h3{margin-bottom:15px;}
input,textarea{width:100%;padding:10px;margin:5px 0 15px;border:1px solid #ddd;border-radius:5px;}
button{background:#667eea;color:white;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;}
table{width:100%;border-collapse:collapse;}
th,td{padding:10px;text-align:left;border-bottom:1px solid #eee;}
.message{padding:10px;margin-bottom:15px;border-radius:5px;display:none;}
.message.success{background:#d4edda;color:#155724;}
.message.error{background:#f8d7da;color:#721c24;}
</style>
</head>
<body>
<div class="container">
<div class="header"><h2>书签管理后台</h2><a href="/logout" style="color:white;">退出登录</a></div>
<div class="card"><h3>添加书签</h3><div id="addMsg" class="message"></div><form id="addForm"><input type="text" id="name" placeholder="名称" required><input type="url" id="url" placeholder="网址" required><input type="text" id="catelog" placeholder="分类"><button type="submit">添加书签</button></form></div>
<div class="card"><h3>书签列表</h3><div id="listMsg" class="message"></div><div id="list"></div></div>
</div>
<script>
async function load(){try{const r=await fetch('/api/sites'),d=await r.json();if(d.success){const h=document.getElementById('list');h.innerHTML='<table><thead><tr><th>名称</th><th>网址</th><th>分类</th><th>操作</th></tr></thead><tbody id="tbody"></tbody></table>';const t=document.getElementById('tbody');t.innerHTML='';d.data.forEach(s=>{const r=t.insertRow();r.insertCell(0).innerHTML='<strong>'+escapeHtml(s.name)+'</strong>';r.insertCell(1).innerHTML='<a href="'+s.url+'" target="_blank">'+s.url.substring(0,40)+'</a>';r.insertCell(2).innerHTML=escapeHtml(s.catelog||'未分类');const a=r.insertCell(3),d=document.createElement('button');d.textContent='删除';d.style.background='#e53e3e';d.style.color='white';d.style.border='none';d.style.padding='5px 10px';d.style.borderRadius='5px';d.style.cursor='pointer';d.onclick=()=>deleteSite(s.id);a.appendChild(d);})}}catch(e){console.error(e)}}
async function deleteSite(id){if(confirm('确定删除？')){await fetch('/api/sites/'+id,{method:'DELETE'});load();}}
function escapeHtml(s){if(!s)return '';return s.replace(/[&<>]/g,function(m){if(m==='&')return '&amp;';if(m==='<')return '&lt;';if(m==='>')return '&gt;';return m;});}
function showMsg(e,t,s){const d=document.getElementById(e);d.textContent=t;d.className='message '+s;d.style.display='block';setTimeout(()=>d.style.display='none',3000);}
document.getElementById('addForm').onsubmit=async e=>{e.preventDefault();const data={name:document.getElementById('name').value.trim(),url:document.getElementById('url').value.trim(),catelog:document.getElementById('catelog').value.trim()};if(!data.name||!data.url){showMsg('addMsg','请填写名称和网址','error');return;}const r=await fetch('/api/sites',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const d=await r.json();if(d.success){showMsg('addMsg','添加成功','success');document.getElementById('addForm').reset();load();}else{showMsg('addMsg','添加失败:'+d.message,'error');}};
load();
</script>
</body></html>`, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }
    
    // ========== 首页 ==========
    const sites = await getSites();
    
    let sitesHtml = '';
    for (const site of sites) {
        sitesHtml += `
            <div class="site">
                <a href="${escapeHtml(site.url)}" target="_blank">
                    <strong>${escapeHtml(site.name)}</strong>
                    <span class="cate">${escapeHtml(site.catelog || '未分类')}</span>
                </a>
            </div>
        `;
    }
    
    if (!sitesHtml) {
        sitesHtml = '<p class="empty">暂无书签，请登录后台添加</p>';
    }
    
    return new Response(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>我的导航</title>
<style>
body{font-family:system-ui;max-width:800px;margin:50px auto;padding:20px;}
h1{text-align:center;color:#333;}
.site{border-bottom:1px solid #eee;padding:12px;}
.site a{text-decoration:none;color:#333;display:block;}
.site a:hover{color:#667eea;}
.cate{color:#888;font-size:12px;margin-left:10px;}
.empty{text-align:center;padding:40px;color:#888;}
.admin-link{display:block;text-align:center;margin-top:30px;color:#667eea;}
</style>
</head>
<body>
<h1>📚 我的导航</h1>
${sitesHtml}
<a href="/admin" class="admin-link">⚙️ 管理后台</a>
</body></html>`, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}
