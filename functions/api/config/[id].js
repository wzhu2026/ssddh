// functions/api/config/[id].js - 使用动态路由参数
export async function onRequest({ request, env, params }) {
    const method = request.method;
    
    // 直接从 params 获取 id
    const id = parseInt(params.id);
    
    // 只处理 DELETE 请求
    if (method === 'DELETE') {
        try {
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
