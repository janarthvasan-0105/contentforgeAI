"use client";
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { blogGenSupabase as supabase } from '@/lib/blog-generator/supabase-client';
import { ArrowLeft, Clock } from 'lucide-react';
import { marked } from 'marked'; 

export default function BlogDetailPage() {
    const { id } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // For legacy HTML content
    const contentRef = useRef(null);

    const [isJsonFormat, setIsJsonFormat] = useState(false);
    const [structuredData, setStructuredData] = useState(null);
    const [metaData, setMetaData] = useState({ description: '', keywords: '', intent: '' });
    const [legacyContent, setLegacyContent] = useState('');

    useEffect(() => {
        fetchBlog();
    }, [id]);

    const fetchBlog = async () => {
        setLoading(true);
        try {
            const { data } = await supabase.from('blogs').select('*').eq('id', id).single();
            if (data) {
                let rawContent = data.content;
                let parsedJson = null;

                try {
                    parsedJson = JSON.parse(rawContent);
                    if (parsedJson && typeof parsedJson === 'object' && parsedJson.sections) {
                        setIsJsonFormat(true);
                        setStructuredData(parsedJson);
                        setMetaData({
                            description: parsedJson.metaDescription || '',
                            keywords: Array.isArray(parsedJson.keywords) ? parsedJson.keywords.join(', ') : (parsedJson.keywords || ''),
                            intent: ''
                        });
                    }
                } catch (e) {
                    setIsJsonFormat(false);
                    let desc = '', keys = '', intent = '';
                    const descMatch = rawContent.match(/<[^>]*>.*?meta description:\s*(.*?)<\/[^>]*>/i);
                    if (descMatch) {
                        desc = descMatch[1].replace(/\*\*/g, '').trim();
                        rawContent = rawContent.replace(descMatch[0], '');
                    }
                    const keysMatch = rawContent.match(/<[^>]*>.*?keywords:\s*(.*?)<\/[^>]*>/i);
                    if (keysMatch) {
                        keys = keysMatch[1].replace(/\*\*/g, '').trim();
                        rawContent = rawContent.replace(keysMatch[0], '');
                    }
                    const intentMatch = rawContent.match(/<[^>]*>.*?search intent:\s*(.*?)<\/[^>]*>/i);
                    if (intentMatch) {
                        intent = intentMatch[1].replace(/\*\*/g, '').trim();
                        rawContent = rawContent.replace(intentMatch[0], '');
                    }
                    
                    setMetaData({ description: desc, keywords: keys, intent: intent });
                    setLegacyContent(rawContent);
                }
                setBlog(data);
            }
        } catch (err) {
            console.error('Error fetching blog:', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!isJsonFormat && blog && contentRef.current) {
            contentRef.current.innerHTML = legacyContent;
        }
    }, [blog, isJsonFormat, legacyContent]);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#8763e5]"></div>
            </div>
        );
    }

    if (!blog) return <div className="text-center py-20">Blog not found.</div>;

    const displayTitle = isJsonFormat && structuredData?.title ? structuredData.title : (blog.title || 'Untitled Blog');

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <Link href="/blog-generator/drafts" className="inline-flex items-center text-[#8763e5] hover:underline mb-8">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to My Blogs
            </Link>

            <header className="mb-10 text-center">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight leading-tight">
                    {displayTitle.replace(/^#+\s*/, '')}
                </h1>
                <div className="flex items-center justify-center gap-4 text-sm text-neutral-500">
                    <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(blog.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span className="px-3 py-1 bg-neutral-100 rounded-full text-xs font-semibold text-neutral-900 capitalize">
                        {blog.status}
                    </span>
                </div>
            </header>

            {isJsonFormat && structuredData?.featuredImage?.url && (
                <div className="mb-12">
                    <img 
                        src={structuredData.featuredImage.url} 
                        alt={structuredData.featuredImage.alt || 'Featured Image'} 
                        className="w-full h-auto max-h-[500px] object-cover rounded-2xl shadow-lg"
                    />
                </div>
            )}

            {!isJsonFormat ? (
                <article ref={contentRef} className="blog-content-body max-w-none text-neutral-900 leading-relaxed font-black" />
            ) : (
                <article className="max-w-none text-neutral-900 leading-relaxed">
                    {structuredData?.sections?.map((section, idx) => (
                        <div key={idx} className="mb-10">
                            {section.heading && (
                                <h2 className="text-2xl font-bold text-neutral-900 mb-4 border-b pb-2">
                                    {section.heading.replace(/^#+\s*/, '')}
                                </h2>
                            )}
                            <div 
                                className="blog-content-body prose prose-neutral max-w-none"
                                dangerouslySetInnerHTML={{ __html: marked.parse(section.body) }}
                            />
                        </div>
                    ))}
                </article>
            )}

            {(metaData.description || metaData.keywords || metaData.intent) && (
                <details className="mt-16 bg-neutral-50 border border-neutral-200 rounded-xl group overflow-hidden">
                    <summary className="p-4 cursor-pointer font-bold text-sm text-neutral-600 group-hover:bg-neutral-100 transition-colors list-none flex items-center justify-between">
                        SEO metadata (not shown to readers)
                        <span className="text-neutral-400 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="p-4 pt-0 text-sm border-t border-neutral-100 mt-2">
                        {metaData.description && <p className="mb-2 mt-3"><strong className="text-neutral-900">Description:</strong> <span className="text-neutral-600">{metaData.description}</span></p>}
                        {metaData.keywords && <p className="mb-2"><strong className="text-neutral-900">Keywords:</strong> <span className="text-neutral-600">{metaData.keywords}</span></p>}
                        {metaData.intent && <p><strong className="text-neutral-900">Intent:</strong> <span className="text-neutral-600">{metaData.intent}</span></p>}
                    </div>
                </details>
            )}
        </div>
    );
}
