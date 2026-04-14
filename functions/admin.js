// functions/admin.js - 后台管理
export function onRequest() {
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
