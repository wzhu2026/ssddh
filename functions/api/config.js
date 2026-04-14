// functions/api/config.js - 完整版
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
        const { name, url, catelog } = body;
        
        let sites = [];
        const data = await NAV_KV.get('sites');
        if (data) sites = JSON.parse(data);
        
        const newId = sites.length ? Math.max(...sites.map(s => s.id)) + 1 : 1;
        sites.unshift({ id: newId, name, url, catelog: catelog || '未分类' });
        await NAV_KV.put('sites', JSON.stringify(sites));
        
        return new Response(JSON.stringify({ code: 201, message: '创建成功' }));
    } catch (e) {
        return new Response(JSON.stringify({ code: 500, message: e.message }));
    }
}

// 关键：导出 onRequestDelete
export async function onRequestDelete({ request, env }) {
    try {
        const url = new URL(request.url);
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
