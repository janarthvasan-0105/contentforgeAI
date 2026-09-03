"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/blog-generator/ui/card';
import { Button } from '@/components/blog-generator/ui/button';
import { blogGenSupabase as supabase } from '@/lib/blog-generator/supabase-client';
import { Edit, Trash2, Clock, Eye, Image as ImageIcon } from 'lucide-react';
import { getCategories } from '@/lib/blog-generator/categoryService';

export default function DraftsPage() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategoryValue, setSelectedCategoryValue] = useState('All Categories');
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchBlogs();
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const cats = await getCategories();
            setCategories(cats);
        } catch (e) {
            console.error('Failed to load categories:', e);
        }
    };

    const formatCategoryValue = (cat) => {
        const emoji = cat.icon ? `${cat.icon} ` : '';
        const cleanGroup = cat.group_name.replace(/\s*\(.*\)/, '').trim();
        
        if (cleanGroup.toLowerCase() === 'huzzler') {
            return `${emoji}${cat.category_name}`;
        } else {
            return `${emoji}${cleanGroup} - ${cat.category_name}`;
        }
    };

    const formatCategoryValueWithoutEmoji = (cat) => {
        const cleanGroup = cat.group_name.replace(/\s*\(.*\)/, '').trim();
        if (cleanGroup.toLowerCase() === 'huzzler') {
            return cat.category_name;
        } else {
            return `${cleanGroup} - ${cat.category_name}`;
        }
    };

    const fetchBlogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('blogs')
                .select('*')
                .order('created_at', { ascending: false });
            if (data) {
                const parsedData = data.map(b => {
                    let cat = b.category || "";
                    if (b.topic && b.topic.includes("|||")) {
                        const parts = b.topic.split("|||");
                        b.topic = parts[0];
                        cat = cat || parts[1];
                    }
                    b.category = cat;
                    return b;
                });
                setBlogs(parsedData);
            }
        } catch (err) {
            console.error('Error fetching blogs:', err);
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure?')) return;
        await supabase.from('blogs').delete().eq('id', id);
        setBlogs(blogs.filter(b => b.id !== id));
    };

    const normalizeCategoryValue = (cat) => {
        if (!cat) return '';
        
        // Strip emojis
        let plain = cat.replace(/^[\p{Emoji}\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, '').trim();
        
        // Remove leading hyphen and trim if present (e.g. "- Pet Grooming")
        if (plain.startsWith('-')) {
            plain = plain.substring(1).trim();
        }
        
        // Split on space-hyphen-space if present to get the core category name
        if (plain.includes(' - ')) {
            const parts = plain.split(' - ');
            plain = parts[parts.length - 1].trim(); // Take the last part (e.g., Pet Grooming)
        }
        
        return plain.toLowerCase().trim();
    };

    const filteredBlogs = selectedCategoryValue === 'All Categories'
        ? blogs
        : blogs.filter(b => normalizeCategoryValue(b.category) === normalizeCategoryValue(selectedCategoryValue));

    // Deduplicate categories using a Map keying on clean value
    const uniqueCategoryMap = new Map();
    categories.forEach(cat => {
        const val = formatCategoryValueWithoutEmoji(cat);
        if (!uniqueCategoryMap.has(val)) {
            uniqueCategoryMap.set(val, {
                label: formatCategoryValue(cat),
                value: val
            });
        }
    });

    const listCategories = [
        { label: "All Categories", value: "All Categories" },
        ...Array.from(uniqueCategoryMap.values())
    ];

    const selectedCategoryObj = listCategories.find(c => c.value === selectedCategoryValue);
    const selectedCategoryLabel = selectedCategoryObj ? selectedCategoryObj.label : 'All Categories';

    return (
        <div className="min-h-[calc(100vh-80px)] bg-[#f9f9fb] w-full font-sans">
            <div className="max-w-7xl mx-auto py-12 px-6 flex flex-col md:flex-row gap-8">
                {/* Sidebar Categories */}
                <aside className="w-full md:w-72 flex-shrink-0">
                    <Card className="border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/90 backdrop-blur-xl sticky top-28 rounded-2xl">
                        <CardHeader className="pb-4 pt-6 px-6">
                            <CardTitle className="text-xl font-bold text-neutral-900 tracking-tight">Categories</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-1.5 p-6 pt-0 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {listCategories.map(catObj => (
                                <button
                                    key={catObj.value}
                                    onClick={() => setSelectedCategoryValue(catObj.value)}
                                    className={`text-left px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${selectedCategoryValue === catObj.value
                                        ? 'bg-[#8763e5]/10 text-[#8763e5] shadow-sm'
                                        : 'hover:bg-neutral-100/70 text-neutral-600 hover:text-neutral-900'
                                        }`}
                                >
                                    {catObj.label}
                                </button>
                            ))}
                        </CardContent>
                    </Card>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1">
                    <div className="flex items-end justify-between mb-8">
                        <h1 className="text-4xl font-black text-neutral-900 tracking-tight">
                            {selectedCategoryLabel}
                        </h1>
                        <span className="text-lg font-medium text-neutral-400 mb-1">
                            {loading ? '...' : `${filteredBlogs.length} Blogs`}
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-32">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#8763e5] border-r-4 border-r-transparent"></div>
                        </div>
                    ) : filteredBlogs.length === 0 ? (
                        <div className="text-center py-24 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-black/5">
                            <div className="w-20 h-20 bg-[#8763e5]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Edit className="w-8 h-8 text-[#8763e5]" />
                            </div>
                            <h2 className="text-2xl font-bold text-neutral-900 tracking-tight mb-2">No blogs found</h2>
                            <p className="text-neutral-500 mb-8 max-w-sm mx-auto">It looks like there are no generated blogs in this category yet. Start creating!</p>
                            <Link href="/blog-generator/generator">
                                <Button className="bg-[#8763e5] hover:bg-[#704ec2] text-white px-8 py-6 text-base font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                                    Generate New Blog
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-5">
                            {filteredBlogs.map(blog => {
                                let thumbnailUrl = null;
                                try {
                                    const parsed = JSON.parse(blog.content);
                                    if (parsed?.featuredImage?.url) {
                                        thumbnailUrl = parsed.featuredImage.url;
                                    }
                                } catch (e) {}

                                return (
                                <Card key={blog.id} className="border-black/5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow duration-300 rounded-2xl overflow-hidden group bg-white">
                                    <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            {thumbnailUrl ? (
                                                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100 border border-neutral-200 shadow-sm">
                                                    <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-neutral-50 border border-neutral-200 text-neutral-400 shadow-sm">
                                                    <ImageIcon className="w-5 h-5" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-xl text-neutral-900 tracking-tight truncate pr-4">{blog.title || 'Untitled Blog Post'}</h3>
                                            <div className="flex flex-wrap items-center gap-3 text-sm mt-3">
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${blog.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {blog.status}
                                                </span>
                                                {blog.category && (() => {
                                                    const catObj = categories.find(c => {
                                                        const cleanGroup = c.group_name.replace(/\s*\(.*\)/, '').trim();
                                                        const cleanCatName = c.category_name;
                                                        const match1 = `${cleanGroup} - ${cleanCatName}`;
                                                        const match2 = cleanCatName;
                                                        
                                                        return match1.toLowerCase() === blog.category.toLowerCase() ||
                                                               match2.toLowerCase() === blog.category.toLowerCase();
                                                    });
                                                    const displayCat = catObj && catObj.icon ? `${catObj.icon} ${blog.category}` : blog.category;
                                                    return (
                                                        <span className="px-3 py-1 rounded-md text-xs font-semibold bg-neutral-100 text-neutral-700">
                                                            {displayCat}
                                                        </span>
                                                    );
                                                })()}
                                                <span className="flex items-center gap-1.5 text-neutral-500 font-medium">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {new Date(blog.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                {blog.seo_score > 0 && (
                                                    <span className="text-neutral-500 font-medium flex items-center gap-1.5 border-l border-neutral-200 pl-3">
                                                        SEO: <span className="text-[#8763e5] font-bold">{blog.seo_score}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-100 md:opacity-80 md:group-hover:opacity-100 transition-opacity">
                                            <Link href={`/blog-generator/blog/${blog.id}`}>
                                                <Button variant="outline" size="sm" className="bg-[#8763e5]/5 hover:bg-[#8763e5]/10 text-[#8763e5] border-[#8763e5]/20 font-semibold rounded-lg">
                                                    <Eye className="h-4 w-4 mr-1.5" /> View
                                                </Button>
                                            </Link>
                                            <Link href={`/blog-generator/editor/${blog.id}`}>
                                                <Button variant="outline" size="sm" className="bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200 rounded-lg">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button variant="outline" size="sm" onClick={() => handleDelete(blog.id)} className="bg-white hover:bg-red-50 text-red-500 border-neutral-200 hover:border-red-200 rounded-lg">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )})}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
