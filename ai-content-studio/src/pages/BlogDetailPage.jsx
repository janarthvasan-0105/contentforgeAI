import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { ArrowLeft, Clock } from 'lucide-react';

export default function BlogDetailPage() {
    const { id } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const contentRef = useRef(null);

    const [metaData, setMetaData] = useState({
        description: '',
        keywords: '',
        intent: ''
    });

    useEffect(() => {
        fetchBlog();
    }, [id]);

    const fetchBlog = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('blogs')
                .select('*')
                .eq('id', id)
                .single();
            if (data) {
                // Process the content before setting state
                let rawContent = data.content;
                let desc = '', keys = '', intent = '';

                // Extract specific meta tags (now embedded within HTML tags like <p>)
                // Using regex to find and remove them from the HTML
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

                data.content = rawContent;

                setMetaData({
                    description: desc,
                    keywords: keys,
                    intent: intent
                });

                setBlog(data);
            }
        } catch (err) {
            console.error('Error fetching blog:', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (blog && contentRef.current) {
            const contentContainer = contentRef.current;
            contentContainer.innerHTML = blog.content;
        }
    }, [blog]);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
            </div>
        );
    }

    if (!blog) {
        return <div className="text-center py-20">Blog not found.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <Link to="/drafts" className="inline-flex items-center text-blue-600 hover:underline mb-8">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to My Blogs
            </Link>

            <header className="mb-10 text-center">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight leading-tight">
                    {blog.title || 'Untitled Blog'}
                </h1>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(blog.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-700 capitalize">
                        {blog.status}
                    </span>
                </div>
            </header>

            {(metaData.description || metaData.keywords || metaData.intent) && (
                <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl mb-10 text-sm">
                    <h3 className="font-bold text-blue-800 mb-3 uppercase tracking-wider text-xs">SEO Metadata</h3>
                    {metaData.description && <p className="mb-2"><strong className="text-blue-900">Description:</strong> <span className="text-blue-700">{metaData.description}</span></p>}
                    {metaData.keywords && <p className="mb-2"><strong className="text-blue-900">Keywords:</strong> <span className="text-blue-700">{metaData.keywords}</span></p>}
                    {metaData.intent && <p><strong className="text-blue-900">Intent:</strong> <span className="text-blue-700">{metaData.intent}</span></p>}
                </div>
            )}

            <article
                ref={contentRef}
                className="blog-content-body max-w-none text-gray-800 leading-relaxed font-serif"
            >
                {/* Content will be inserted here by marked.parse() */}
            </article>
        </div>
    );
}
