// functions/api/config.js - 处理 /api/config
export async function onRequest({ request, env }) {
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
            const { name, url, catelog } = body;
            
            let sites = [];
            const data = await NAV_KV.get('sites');
            if (data) sites = JSON.parse(data);
            
            const newId = sites.length ? Math.max(...sites.map(s => s.id)) + 1 : 1;
            sites.unshift({ id: newId, name, url, catelog: catelog || '未分类' });
            await NAV_KV.put('sites', JSON.stringify(sites));
            
            return new Response(JSON.stringify({ code: 201, message: '创建成功' }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (e) {
            return new Response(JSON.stringify({ code: 500, message: e.message }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
    
    return new Response(JSON.stringify({ code: 405, message: 'Method Not Allowed' }), { status: 405 });
}
