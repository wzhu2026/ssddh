export function onRequest(context) {
    return new Response(`
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><title>测试</title></head>
        <body>
            <h1>Admin 页面工作正常</h1>
            <p>如果看到这个页面，说明路由正确。</p>
        </body>
        </html>
    `, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}
