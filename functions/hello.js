export function onRequest() {
    return new Response('Hello World! 部署成功！', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
}
