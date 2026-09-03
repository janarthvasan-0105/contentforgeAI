import { NextRequest } from 'next/server';
import { publishToSubstack } from '@/lib/blog-generator/substackPublisher';

export async function POST(req: NextRequest) {
    try {
        const { title, content, cookie } = await req.json();

        if (!title || !content) {
            return new Response(JSON.stringify({ error: 'Title and content are required' }), { status: 400 });
        }

        const stream = new ReadableStream({
            async start(controller) {
                const sendUpdate = (obj: any) => {
                    const text = JSON.stringify(obj) + '\n';
                    controller.enqueue(new TextEncoder().encode(text));
                };

                try {
                    const result = await publishToSubstack({ title, content, cookie }, (status: string, details: string) => {
                        sendUpdate({ type: 'status', status, details });
                    });

                    sendUpdate({ type: 'success', url: result.url });
                    controller.close();
                } catch (err: any) {
                    sendUpdate({ type: 'error', error: err.message });
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            },
        });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
