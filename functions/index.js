export async function onRequest({ env }) {
    let sites = [];
    try {
        const data = await NAV_KV.get('sites');
        if (data) sites = JSON.parse(data);
    } catch (e) {}
    
    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : m === '>' ? '&gt;' : m);
    }
    
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
