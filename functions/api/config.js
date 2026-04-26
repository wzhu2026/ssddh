export async function onRequest({ request, env }) {
    const method = request.method;
    const url = new URL(request.url);
    
    // GET - 获取所有书签（按sort_order排序）
    if (method === 'GET') {
        let sites = [];
        try {
            const data = await env.NAV_KV.get('sites');
            if (data) sites = JSON.parse(data);
            sites.sort((a, b) => {
                const orderA = a.sort_order !== undefined ? a.sort_order : 9999;
                const orderB = b.sort_order !== undefined ? b.sort_order : 9999;
                if (orderA !== orderB) return orderA - orderB;
                return b.id - a.id;
            });
        } catch (e) {}
        return new Response(JSON.stringify({ code: 200, data: sites }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // POST - 添加书签
    if (method === 'POST') {
        try {
            const body = await request.json();
            const { name, url: siteUrl, catelog, logo, desc, sort_order } = body;
            
            let sites = [];
            const data = await env.NAV_KV.get('sites');
            if (data) sites = JSON.parse(data);
            
            const newId = sites.length ? Math.max(...sites.map(s => s.id)) + 1 : 1;
            const newSite = { 
                id: newId, 
                name, 
                url: siteUrl, 
                catelog, 
                logo, 
                desc, 
                sort_order: sort_order !== undefined ? sort_order : 9999 
            };
            sites.push(newSite);
            
            sites.sort((a, b) => {
                const orderA = a.sort_order !== undefined ? a.sort_order : 9999;
                const orderB = b.sort_order !== undefined ? b.sort_order : 9999;
                if (orderA !== orderB) return orderA - orderB;
                return b.id - a.id;
            });
            
            await env.NAV_KV.put('sites', JSON.stringify(sites));
            
            return new Response(JSON.stringify({ code: 201, message: '创建成功' }));
        } catch (e) {
            return new Response(JSON.stringify({ code: 500, message: e.message }));
        }
    }
    
    // PUT - 更新书签
    if (method === 'PUT') {
        try {
            const id = parseInt(url.pathname.split('/').pop());
            const body = await request.json();
            const { name, url: siteUrl, catelog, logo, desc, sort_order } = body;
            
            let sites = [];
            const data = await env.NAV_KV.get('sites');
            if (data) sites = JSON.parse(data);
            
            const index = sites.findIndex(s => s.id === id);
            if (index !== -1) {
                sites[index] = { 
                    ...sites[index], 
                    name, 
                    url: siteUrl, 
                    catelog, 
                    logo, 
                    desc, 
                    sort_order: sort_order !== undefined ? sort_order : 9999 
                };
                
                sites.sort((a, b) => {
                    const orderA = a.sort_order !== undefined ? a.sort_order : 9999;
                    const orderB = b.sort_order !== undefined ? b.sort_order : 9999;
                    if (orderA !== orderB) return orderA - orderB;
                    return b.id - a.id;
                });
                
                await env.NAV_KV.put('sites', JSON.stringify(sites));
            }
            
            return new Response(JSON.stringify({ code: 200, message: '更新成功' }));
        } catch (e) {
            return new Response(JSON.stringify({ code: 500, message: e.message }));
        }
    }
    
    // DELETE - 删除书签
    if (method === 'DELETE') {
        try {
            const id = parseInt(url.pathname.split('/').pop());
            
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
