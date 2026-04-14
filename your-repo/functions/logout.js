// functions/logout.js
export async function onRequest(context) {
    const { request, env } = context;
    
    // 获取 token 并删除
    const cookie = request.headers.get('Cookie') || '';
    const match = cookie.match(/admin_token=([^;]+)/);
    if (match) {
        await env.NAV_KV.delete(`session:${match[1]}`);
    }
    
    return new Response(null, {
        status: 302,
        headers: {
            'Location': '/',
            'Set-Cookie': 'admin_token=; Path=/; Max-Age=0'
        }
    });
}
