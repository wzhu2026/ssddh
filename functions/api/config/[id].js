export async function onRequest({ request, env, params }) {
    const method = request.method;
    
    if (method === 'DELETE') {
        try {
            const id = parseInt(params.id);
            
            let sites = [];
            const data = await env.NAV_KV.get('sites');
            if (data) sites = JSON.parse(data);
            
            const newSites = sites.filter(s => s.id !== id);
            await env.NAV_KV.put('sites', JSON.stringify(newSites));
            
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
