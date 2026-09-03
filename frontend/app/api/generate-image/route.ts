import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_BLOG_GEN_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_BLOG_GEN_SUPABASE_ANON_KEY;
const IDEOGRAM_API_KEY = process.env.IDEOGRAM_API_KEY || "b0sR1IINV6MRd86OlkpIo3tQ3LcpZvuYbYi1GtaYX7QZMkplKnPi5OEjHB4-LKJ6q5RLU__VVtSLrOH0E2iviw"; // Fallback to backend key if not in env

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function POST(req) {
    try {
        const { topic } = await req.json();

        if (!topic) {
            return NextResponse.json({ error: "Topic is required" }, { status: 400 });
        }

        const prompt = `A high-quality, professional editorial illustration for a blog post about: ${topic}. Clean, modern, cinematic lighting, highly detailed, suitable for a tech or business blog header.`;

        const response = await fetch("https://api.ideogram.ai/v1/ideogram-v4/generate", {
            method: "POST",
            headers: {
                "Api-Key": IDEOGRAM_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text_prompt: prompt,
                aspect_ratio: "ASPECT_16_9",
                seed: Math.floor(Math.random() * 1000000)
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Ideogram API error:", errorText);
            return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
        }

        const data = await response.json();
        const imgUrl = data.data?.[0]?.url;

        if (!imgUrl) {
            return NextResponse.json({ error: "No image URL returned" }, { status: 500 });
        }

        // Download the image
        const imgRes = await fetch(imgUrl);
        const imgBuffer = await imgRes.arrayBuffer();

        // Upload to Supabase Storage
        const filename = `featured-images/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
        
        const { error: uploadError } = await supabase.storage
            .from('blog-media')
            .upload(filename, imgBuffer, {
                contentType: 'image/png',
                upsert: false
            });

        if (uploadError) {
            console.error("Supabase storage error:", uploadError);
            return NextResponse.json({ error: "Failed to upload to storage" }, { status: 500 });
        }

        const { data: publicUrlData } = supabase.storage
            .from('blog-media')
            .getPublicUrl(filename);

        return NextResponse.json({ url: publicUrlData.publicUrl });
        
    } catch (error) {
        console.error("Image generation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
