export async function onRequestGet({ env }) {
    let sites = [];
    try {
        const data = await NAV_KV.get('sites');
        if (data) sites = JSON.parse(data);
    } catch (e) {}
    return new Response(JSON.stringify({ success: true, data: sites }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const { name, url, catelog } = body;
        
        let sites = [];
        const data = await NAV_KV.get('sites');
        if (data) sites = JSON.parse(data);
        
        const newId = sites.length ? Math.max(...sites.map(s => s.id)) + 1 : 1;
        sites.unshift({ id: newId, name, url, catelog: catelog || '未分类' });
        await NAV_KV.put('sites', JSON.stringify(sites));
        
        return new Response(JSON.stringify({ success: true, message: '添加成功' }));
    } catch (e) {
        return new Response(JSON.stringify({ success: false, message: e.message }));
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
    
    return new Response(JSON.stringify({ success: true, message: '删除成功' }));
}
