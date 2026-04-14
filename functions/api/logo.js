// functions/api/logo.js
export async function onRequestGet({ env }) {
    try {
        const logo = await NAV_KV.get('site_logo') || '';
        return new Response(JSON.stringify({ code: 200, logo }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ code: 500, message: e.message }));
    }
}

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const logo = body.logo || '';
        if (logo) {
            await NAV_KV.put('site_logo', logo);
        } else {
            await NAV_KV.delete('site_logo');
        }
        return new Response(JSON.stringify({ code: 200, message: '保存成功' }));
    } catch (e) {
        return new Response(JSON.stringify({ code: 500, message: e.message }));
    }
}
