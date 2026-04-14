// functions/api/config.js
export async function onRequestGet({ env }) {
    let sites = [];
    try {
        const data = await NAV_KV.get('sites');
        if (data) sites = JSON.parse(data);
    } catch (e) {}
    return new Response(JSON.stringify({ code: 200, data: sites }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const { name, url, catelog, logo, desc, sort_order } = body;
        
        let sites = [];
        const data = await NAV_KV.get('sites');
        if (data) sites = JSON.parse(data);
        
        const newId = sites.length ? Math.max(...sites.map(s => s.id)) + 1 : 1;
        sites.unshift({ id: newId, name, url, catelog, logo, desc, sort_order: sort_order || 9999 });
        await NAV_KV.put('sites', JSON.stringify(sites));
        
        return new Response(JSON.stringify({ code: 201, message: '创建成功' }));
    } catch (e) {
        return new Response(JSON.stringify({ code: 500, message: e.message }));
    }
}

export async function onRequestPut({ request, env }) {
    const url = new URL(request.url);
    const id = parseInt(url.pathname.split('/').pop());
    
    try {
        const body = await request.json();
        const { name, url: siteUrl, catelog, logo, desc, sort_order } = body;
        
        let sites = [];
        const data = await NAV_KV.get('sites');
        if (data) sites = JSON.parse(data);
        
        const index = sites.findIndex(s => s.id === id);
        if (index !== -1) {
            sites[index] = { ...sites[index], name, url: siteUrl, catelog, logo, desc, sort_order: sort_order || 9999 };
            await NAV_KV.put('sites', JSON.stringify(sites));
        }
        
        return new Response(JSON.stringify({ code: 200, message: '更新成功' }));
    } catch (e) {
        return new Response(JSON.stringify({ code: 500, message: e.message }));
    }
}

export async function onRequestDelete({ request, env }) {
    const url = new URL(request.url);
    const id = parseInt(url.pathname.split('/').pop());
    
    let sites = [];
    const data = await NAV_KV.get('sites');
    if (data) sites = JSON.parse(data);
    
    const newSites = sites.filter(s => s.id !== id);
    await NAV_KV.put('sites', JSON.stringify(newSites));
    
    return new Response(JSON.stringify({ code: 200, message: '删除成功' }));
}
