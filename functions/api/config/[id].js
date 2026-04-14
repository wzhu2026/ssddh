// functions/api/config/[id].js - 处理 /api/config/1, /api/config/2 等
export async function onRequest({ request, env }) {
    const url = new URL(request.url);
    const method = request.method;
    
    // 只处理 DELETE 请求
    if (method === 'DELETE') {
        try {
            // 从路径中获取 ID，例如 /api/config/1 中的 1
            const id = parseInt(url.pathname.split('/').pop());
            
            let sites = [];
            const data = await NAV_KV.get('sites');
            if (data) sites = JSON.parse(data);
            
            const newSites = sites.filter(s => s.id !== id);
            await NAV_KV.put('sites', JSON.stringify(newSites));
            
            return new Response(JSON.stringify({ code: 200, message: '删除成功' }), {
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
