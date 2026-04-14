// functions/api/config.js - 统一处理版本
export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const method = request.method;

    // 1. 处理 GET 请求 - 获取所有书签
    if (method === 'GET') {
        let sites = [];
        try {
            const data = await NAV_KV.get('sites');
            if (data) sites = JSON.parse(data);
        } catch (e) {}
        return new Response(JSON.stringify({ code: 200, data: sites }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 2. 处理 POST 请求 - 添加书签
    if (method === 'POST') {
        try {
            const body = await request.json();
            const { name, url: siteUrl, catelog } = body;
            
            let sites = [];
            const data = await NAV_KV.get('sites');
            if (data) sites = JSON.parse(data);
            
            const newId = sites.length ? Math.max(...sites.map(s => s.id)) + 1 : 1;
            sites.unshift({ id: newId, name, url: siteUrl, catelog: catelog || '未分类' });
            await NAV_KV.put('sites', JSON.stringify(sites));
            
            return new Response(JSON.stringify({ code: 201, message: '创建成功' }));
        } catch (e) {
            return new Response(JSON.stringify({ code: 500, message: e.message }));
        }
    }

    // 3. 【关键修复】处理 DELETE 请求 - 删除书签
    if (method === 'DELETE') {
        try {
            // 从 URL 中提取书签 ID，例如 /api/config/1
            const id = parseInt(url.pathname.split('/').pop());
            
            let sites = [];
            const data = await NAV_KV.get('sites');
            if (data) sites = JSON.parse(data);
            
            const newSites = sites.filter(s => s.id !== id);
            await NAV_KV.put('sites', JSON.stringify(newSites));
            
            return new Response(JSON.stringify({ code: 200, message: '删除成功' }));
        } catch (e) {
            return new Response(JSON.stringify({ code: 500, message: e.message }));
        }
    }

    // 如果不是以上方法，返回 405 Method Not Allowed
    return new Response(JSON.stringify({ code: 405, message: 'Method Not Allowed' }), { status: 405 });
}
