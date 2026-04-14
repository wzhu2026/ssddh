export async function onRequest(context) {
    const { env } = context;
    
    let sites = [];
    try {
        const data = await env.NAV_KV.get('sites');
        if (data) sites = JSON.parse(data);
    } catch (e) {}
    
    let html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>我的导航</title>
<style>
body{font-family:system-ui;max-width:800px;margin:50px auto;padding:20px;}
.site{border-bottom:1px solid #eee;padding:10px;}
.site a{text-decoration:none;color:#333;}
.cate{color:#888;font-size:12px;margin-left:10px;}
</style>
</head>
<body>
<h1>📚 我的导航</h1>`;
    
    for (const site of sites) {
        html += `<div class="site">
            <a href="${escapeHtml(site.url)}" target="_blank"><strong>${escapeHtml(site.name)}</strong></a>
            <span class="cate">${escapeHtml(site.catelog || '未分类')}</span>
        </div>`;
    }
    
    if (sites.length === 0) {
        html += '<p>暂无书签，请登录后台添加</p>';
    }
    
    html += `<div style="margin-top:30px;"><a href="/admin">管理后台</a></div>
</body>
</html>`;
    
    return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
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
