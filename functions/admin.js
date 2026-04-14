export async function onRequest({ request, env }) {
    const cookie = request.headers.get('Cookie') || '';
    const match = cookie.match(/admin_token=([^;]+)/);
    let isLoggedIn = false;
    
    if (match) {
        const session = await NAV_KV.get(`session:${match[1]}`);
        isLoggedIn = session !== null;
    }
    
    // 未登录显示登录页
    if (!isLoggedIn) {
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
    
    // 已登录显示后台
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
