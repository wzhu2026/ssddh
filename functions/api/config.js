// functions/api/config.js - 使用 onRequest 统一处理所有方法
export async function onRequest({ request, env }) {
    const url = new URL(request.url);
    const method = request.method;
    
    // GET - 获取所有书签
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
    
    // POST - 添加书签
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
    
    // DELETE - 删除书签
    if (method === 'DELETE') {
        try {
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
    
    return new Response(JSON.stringify({ code: 405, message: 'Method Not Allowed' }), { status: 405 });
}
