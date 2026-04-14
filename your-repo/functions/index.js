export function onRequest(context) {
    return new Response('Hello World! EdgeOne Pages 工作正常。', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
}
