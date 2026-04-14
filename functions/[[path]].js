// functions/[[path]].js - 工作版本
export function onRequest(context) {
    const url = new URL(context.request.url);
    const pathname = url.pathname;

    // 后台管理
    if (pathname === '/admin') {
        return new Response(`
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><title>后台管理</title></head>
            <body>
                <h1>✅ 后台管理页面</h1>
                <p>/admin 路由正常工作。</p>
                <a href="/">返回首页</a>
            </body>
            </html>
        `, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }

    // 首页 - 和 hello 一样简单
    return new Response(`
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><title>首页</title></head>
        <body>
            <h1>✅ 首页</h1>
            <p>根路径正常工作！</p>
            <a href="/admin">管理后台</a>
        </body>
        </html>
    `, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}
