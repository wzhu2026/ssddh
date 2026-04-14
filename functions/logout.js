export async function onRequestPost({ request, env }) {
    const cookie = request.headers.get('Cookie') || '';
    const match = cookie.match(/admin_token=([^;]+)/);
    if (match) {
        await NAV_KV.delete(`session:${match[1]}`);
    }
    
    return new Response(null, {
        status: 302,
        headers: {
            'Location': '/',
            'Set-Cookie': 'admin_token=; Path=/; Max-Age=0'
        }
    });
}
