import { NextResponse } from 'next/server';
import { createReadStream, statSync } from 'fs';

export async function GET(request: Request) {
  const filePath = 'D:\\ContentForge\\Cube_ignites_ContentforgeAI_logo_1080p_202607141412.mp4';
  
  try {
    const stat = statSync(filePath);
    
    // We will use a ReadableStream for the response
    const stream = createReadStream(filePath);
    
    // Convert Node.js readable stream to Web API ReadableStream
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      },
      cancel() {
        stream.destroy();
      }
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': stat.size.toString(),
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (err) {
    console.error("Error serving video:", err);
    return new NextResponse("Video Not Found", { status: 404 });
  }
}
