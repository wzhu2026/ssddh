// functions/api/config.js
export async function onRequest(context) {
    const { request, env } = context;
    
    // 获取书签列表
    if (request.method === 'GET') {
        let sites = [];
        try {
            const data = await env.NAV_KV.get('sites');
            if (data) sites = JSON.parse(data);
        } catch(e) {}
        return new Response(JSON.stringify({ code: 200, data: sites }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // 添加书签
    if (request.method === 'POST') {
        try {
            const body = await request.json();
            const { name, url, catelog } = body;
            
            let sites = [];
            const data = await env.NAV_KV.get('sites');
            if (data) sites = JSON.parse(data);
            
            const newId = sites.length ? Math.max(...sites.map(s => s.id)) + 1 : 1;
            sites.unshift({ id: newId, name, url, catelog: catelog || '未分类' });
            await env.NAV_KV.put('sites', JSON.stringify(sites));
            
            return new Response(JSON.stringify({ code: 201, message: '创建成功' }));
        } catch(e) {
            return new Response(JSON.stringify({ code: 500, message: e.message }));
        }
    }
    
    return new Response('Not Found', { status: 404 });
}

// 处理 DELETE /api/config/:id
export async function onRequestDelete(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const id = parseInt(url.pathname.split('/').pop());
    
    let sites = [];
    const data = await env.NAV_KV.get('sites');
    if (data) sites = JSON.parse(data);
    
    const newSites = sites.filter(s => s.id !== id);
    await env.NAV_KV.put('sites', JSON.stringify(newSites));
    
    return new Response(JSON.stringify({ code: 200, message: '删除成功' }));
}
