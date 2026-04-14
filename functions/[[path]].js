// functions/[[path]].js - 修复默认路由
export function onRequest(context) {
    const url = new URL(context.request.url);
    const pathname = url.pathname;

    // 1. 处理后台管理请求
    if (pathname === '/admin') {
        return new Response(`
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><title>后台管理</title></head>
            <body>
                <h1>✅ 后台管理页面</h1>
                <p>如果看到这个页面，说明 /admin 路由正常工作。</p>
                <a href="/">返回首页</a>
            </body>
            </html>
        `, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }

    // 2. 【关键修复】处理所有其他请求（包括根路径 /）
    // 这个 return 必须存在，并且要放在所有 if 判断之后
    return new Response(`
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><title>首页</title></head>
        <body>
            <h1>✅ 首页</h1>
            <p>如果看到这个页面，说明根路径 / 已被正确捕获并处理。</p>
            <p>之前的 544 错误是因为这个默认返回语句缺失或出错。</p>
            <a href="/admin">管理后台</a>
        </body>
        </html>
    `, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}
