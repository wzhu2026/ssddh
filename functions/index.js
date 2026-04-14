// functions/index.js - 专门处理首页
export function onRequest() {
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
