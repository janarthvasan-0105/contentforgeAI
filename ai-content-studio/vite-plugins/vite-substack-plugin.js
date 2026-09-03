import { publishToSubstack } from '../server/substackPublisher.js';

export function viteSubstackPlugin() {
    return {
        name: 'vite-substack-plugin',
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                if (req.url === '/api/publish/substack' && req.method === 'POST') {
                    // Set up chunked streaming response
                    res.writeHead(200, {
                        'Content-Type': 'text/plain',
                        'Transfer-Encoding': 'chunked',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive'
                    });

                    let body = '';
                    req.on('data', chunk => {
                        body += chunk;
                    });

                    req.on('end', async () => {
                        try {
                            const { title, content, cookie } = JSON.parse(body);

                            if (!title || !content) {
                                res.write(JSON.stringify({ error: 'Title and content are required' }) + '\n');
                                res.end();
                                return;
                            }

                            // Run Substack publisher and stream progress updates
                            const result = await publishToSubstack({ title, content, cookie }, (status, details) => {
                                res.write(JSON.stringify({ type: 'status', status, details }) + '\n');
                            });

                            res.write(JSON.stringify({ type: 'success', url: result.url }) + '\n');
                            res.end();
                        } catch (err) {
                            res.write(JSON.stringify({ type: 'error', error: err.message }) + '\n');
                            res.end();
                        }
                    });
                } else {
                    next();
                }
            });
        }
    };
}
