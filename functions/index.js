// functions/index.js - 首页
export async function onRequestGet({ env }) {
    const sites = await getSites(env);
    const logo = await getLogo(env);
    const logoLink = await getLogoLink(env);
    const catOrders = await getCategoryOrders(env);
    
    // 获取所有分类
    const catMap = new Map();
    sites.forEach(s => {
        const cat = s.catelog || '未分类';
        if (!catMap.has(cat)) {
            catMap.set(cat, { count: 0, sortOrder: catOrders.get(cat) || 9999 });
        }
        catMap.get(cat).count++;
    });
    
    const categories = Array.from(catMap.keys()).sort((a, b) => {
        const orderA = catMap.get(a).sortOrder;
        const orderB = catMap.get(b).sortOrder;
        if (orderA !== orderB) return orderA - orderB;
        return a.localeCompare(b, 'zh-CN');
    });
    
    const url = new URL(env.request?.url || '');
    const currentCat = url.searchParams.get('c') || '';
    const filteredSites = currentCat ? sites.filter(s => (s.catelog || '未分类') === currentCat) : sites;
    
    // 生成侧边栏分类列表
    let catNavHtml = categories.map(cat => {
        const activeClass = currentCat === cat ? 'background:#e2e8f0;color:#667eea;font-weight:600' : '';
        return `<a href="/?c=${encodeURIComponent(cat)}" class="cat-link" style="display:block;padding:10px 12px;margin:4px 0;border-radius:8px;text-decoration:none;color:#4a5568;transition:all 0.2s;${activeClass}">📁 ${escapeHtml(cat)} <span style="float:right;color:#a0aec0;font-size:12px">${catMap.get(cat).count}</span></a>`;
    }).join('');
    
    // 生成卡片列表
    let cardsHtml = filteredSites.map(s => {
        const name = escapeHtml(s.name || '未命名');
        const url_clean = sanitizeUrl(s.url);
        const logo_clean = s.logo ? sanitizeUrl(s.logo) : '';
        const desc = escapeHtml(s.desc || '暂无描述');
        const cat = escapeHtml(s.catelog || '未分类');
        const initial = (s.name && s.name[0]) || '站';
        
        return `
            <div class="site-card" style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);transition:all 0.3s;cursor:pointer">
                <a href="${url_clean}" target="_blank" style="text-decoration:none;color:inherit;display:block">
                    <div style="display:flex;align-items:center;margin-bottom:12px">
                        ${logo_clean ? `<img src="${logo_clean}" style="width:44px;height:44px;border-radius:10px;object-fit:cover;margin-right:14px;flex-shrink:0">` : `<div style="width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18px;margin-right:14px;flex-shrink:0">${initial}</div>`}
                        <div style="flex:1;min-width:0">
                            <h3 style="font-size:16px;font-weight:600;color:#2d3748;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</h3>
                            <span style="font-size:11px;color:#a0aec0;background:#f7fafc;padding:2px 8px;border-radius:12px;display:inline-block">${cat}</span>
                        </div>
                    </div>
                    <p style="font-size:13px;color:#718096;margin-bottom:12px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${desc}</p>
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <span style="font-size:11px;color:#a0aec0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${url_clean.replace(/^https?:\/\//, '').substring(0,30)}</span>
                        <button class="copy-btn" data-url="${url_clean}" style="background:#edf2f7;border:none;padding:5px 14px;border-radius:20px;font-size:11px;cursor:pointer;transition:0.2s;margin-left:8px;flex-shrink:0">复制</button>
                    </div>
                </a>
            </div>
        `;
    }).join('');
    
    // Logo HTML
    let logoHtml = '';
    if (logo) {
        const imgTag = `<img src="${escapeHtml(logo)}" style="max-width:200px; max-height:240px; width:auto; height:auto; object-fit:contain;">`;
        if (logoLink) {
            logoHtml = `<a href="${escapeHtml(logoLink)}" target="_blank" style="display:block;text-decoration:none">${imgTag}</a>`;
        } else {
            logoHtml = imgTag;
        }
    } else {
        logoHtml = `<div style="font-size:28px;font-weight:bold;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent">旭儿导航</div>`;
    }
    
    const title = currentCat ? `${escapeHtml(currentCat)} · ${filteredSites.length} 个网站` : `全部收藏 · ${sites.length} 个网站`;
    const emptyHtml = filteredSites.length === 0 ? `
        <div style="text-align:center;padding:60px;background:white;border-radius:12px">
            <div style="font-size:48px;margin-bottom:16px">📭</div>
            <h3 style="margin-bottom:8px">暂无书签</h3>
            <p style="margin-bottom:16px;color:#718096">还没有添加任何书签，请登录后台添加</p>
            <a href="/admin" style="display:inline-block;padding:10px 20px;background:#667eea;color:white;border-radius:8px;text-decoration:none">登录后台</a>
        </div>
    ` : '';
    
    return new Response(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <title>朱氏家族门户 - 旭儿导航</title>
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:#f7fafc;min-height:100vh}
        .sidebar{position:fixed;left:0;top:0;width:280px;height:100vh;background:white;box-shadow:2px 0 12px rgba(0,0,0,0.05);overflow-y:auto;z-index:100;transition:transform 0.3s ease}
        .sidebar::-webkit-scrollbar{width:5px}
        .sidebar::-webkit-scrollbar-track{background:#f1f1f1}
        .sidebar::-webkit-scrollbar-thumb{background:#cbd5e0;border-radius:5px}
        .sidebar-header{padding:20px;border-bottom:1px solid #e2e8f0;text-align:center;min-height:auto;max-height:280px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%);overflow:hidden}
        .sidebar-header img{max-width:200px;max-height:240px;width:auto;height:auto;object-fit:contain}
        .sidebar-header a{display:block}
        .sidebar-nav{padding:20px 15px}
        .cat-link:hover{background:#f7fafc;transform:translateX(3px)}
        .main{margin-left:280px;min-height:100vh;width:calc(100% - 280px)}
        .header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:50px 40px;text-align:center}
        .header h1{font-size:42px;margin-bottom:12px;font-weight:600}
        .content{max-width:1300px;margin:0 auto;padding:35px 30px}
        .content-header{margin-bottom:25px;padding-bottom:15px;border-bottom:2px solid #e2e8f0}
        .content-header h2{font-size:22px;color:#2d3748;font-weight:600}
        .sites-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:24px;margin-top:10px}
        .site-card{transition:all 0.3s ease}
        .site-card:hover{transform:translateY(-3px);box-shadow:0 8px 20px rgba(0,0,0,0.12)}
        .copy-btn:hover{background:#cbd5e0;transform:scale(1.02)}
        .mobile-toggle{display:none;position:fixed;top:15px;left:15px;z-index:101;background:white;border:none;padding:10px 15px;border-radius:10px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.15);font-size:18px;font-weight:bold}
        .datetime{margin-top:15px;font-size:13px;opacity:0.95}
        .datetime span{background:rgba(255,255,255,0.2);padding:5px 12px;border-radius:20px;display:inline-block}
        @media (max-width:768px){
            .sidebar{transform:translateX(-100%);width:280px}
            .sidebar.open{transform:translateX(0)}
            .main{margin-left:0;width:100%}
            .mobile-toggle{display:block}
            .header h1{font-size:28px}
            .header{padding:40px 20px}
            .content{padding:20px 15px}
            .sites-grid{grid-template-columns:1fr;gap:16px}
        }
        @media (min-width:769px) and (max-width:1024px){
            .sites-grid{grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px}
        }
    </style>
</head>
<body>
    <button class="mobile-toggle" id="mobileToggle">☰ 菜单</button>
    <div class="sidebar" id="sidebar">
        <div class="sidebar-header">${logoHtml}</div>
        <div class="sidebar-nav">
            <a href="/" class="cat-link" style="display:block;padding:10px 12px;margin-bottom:8px;background:#e2e8f0;border-radius:8px;text-decoration:none;color:#667eea;font-weight:600;text-align:center">🏠 全部网站</a>
            <div style="margin-top:8px"></div>
            ${catNavHtml}
            <div style="margin-top:25px;padding-top:20px;border-top:1px solid #e2e8f0">
                <a href="/admin" style="display:block;padding:10px 12px;background:#edf2f7;border-radius:8px;text-decoration:none;color:#4a5568;text-align:center;transition:0.2s">⚙️ 后台管理</a>
            </div>
        </div>
    </div>
    <div class="main">
        <div class="header">
            <h1 style="font-size: 60px;">朱  氏  家  族  门  户</h1>
            <p style="font-size:16px;opacity:0.92;margin-top:8px">虚拟世界 · 无限可能 · 探索世界 · 充实人生</p>
            <div class="datetime"><span>北京时间 ${new Date().toLocaleString('zh-CN', {timeZone:'Asia/Shanghai', year:'numeric', month:'long', day:'numeric', weekday:'long'})}</span><span style="margin-left:10px">⏰ ${new Date().toLocaleString('zh-CN', {timeZone:'Asia/Shanghai', hour:'2-digit', minute:'2-digit', second:'2-digit'})}</span>  祝在此时此刻相遇的您：一生幸福平安 · 万事如意</div>
        </div>
        <div class="content">
            <div class="content-header"><h2>📖 ${title}</h2></div>
            <div class="sites-grid">${cardsHtml || emptyHtml}</div>
        </div>
    </div>
    <script>
        const sidebar=document.getElementById('sidebar'),toggleBtn=document.getElementById('mobileToggle');
        if(toggleBtn) toggleBtn.onclick=()=>sidebar.classList.toggle('open');
        document.querySelectorAll('.copy-btn').forEach(btn=>{btn.onclick=e=>{e.preventDefault();const url=btn.dataset.url;navigator.clipboard.writeText(url).then(()=>{const t=btn.textContent;btn.textContent='✓ 已复制';btn.style.background='#38a169';btn.style.color='white';setTimeout(()=>{btn.textContent=t;btn.style.background='#edf2f7';btn.style.color=''},1500)})}});
        document.querySelectorAll('.site-card').forEach(card=>{const link=card.querySelector('a');if(link){card.style.cursor='pointer';card.onclick=e=>{if(e.target.classList&&e.target.classList.contains('copy-btn'))return;link.click()}}});
    </script>
</body>
</html>`, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

// ========== KV 操作函数 ==========
async function getSites(env) {
    try {
        const data = await NAV_KV.get('sites');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

async function getLogo(env) {
    try {
        return await NAV_KV.get('site_logo') || '';
    } catch (e) {
        return '';
    }
}

async function getLogoLink(env) {
    try {
        return await NAV_KV.get('site_logo_link') || '';
    } catch (e) {
        return '';
    }
}

async function getCategoryOrders(env) {
    try {
        const data = await NAV_KV.get('category_orders');
        return data ? new Map(JSON.parse(data)) : new Map();
    } catch (e) {
        return new Map();
    }
}

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
