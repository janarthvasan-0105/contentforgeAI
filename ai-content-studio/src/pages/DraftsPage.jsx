import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '../supabase/client';
import { Edit, Trash2, Clock, Eye } from 'lucide-react';
import { getCategories } from '../services/categoryService';

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
        <div className="max-w-7xl mx-auto py-10 px-4 flex flex-col md:flex-row gap-8">
            <aside className="w-full md:w-64 flex-shrink-0">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-xl">Categories</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-1 p-3 pt-0 max-h-[70vh] overflow-y-auto">
                        {listCategories.map(catObj => (
                            <button
                                key={catObj.value}
                                onClick={() => setSelectedCategoryValue(catObj.value)}
                                className={`text-left px-3 py-2 rounded-lg transition-colors text-sm ${selectedCategoryValue === catObj.value
                                    ? 'bg-blue-100 text-blue-700 font-semibold'
                                    : 'hover:bg-gray-100 text-gray-700'
                                    }`}
                            >
                                {catObj.label}
                            </button>
                        ))}
                    </CardContent>
                </Card>
            </aside>

            <div className="flex-1">
                <h1 className="text-3xl font-bold mb-6">
                    {selectedCategoryLabel} - {loading ? '...' : filteredBlogs.length} Blogs
                </h1>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
                    </div>
                ) : filteredBlogs.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
                        <p className="text-lg mb-4">No blogs found in this category.</p>
                        <Link to="/generator">
                            <Button>Generate Blog</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredBlogs.map(blog => (
                            <Card key={blog.id}>
                                <CardContent className="p-5 flex items-center justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg">{blog.title || 'Untitled'}</h3>
                                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${blog.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
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
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                        {displayCat}
                                                    </span>
                                                );
                                            })()}
                                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(blog.created_at).toLocaleDateString()}</span>
                                            {blog.seo_score > 0 && <span>SEO: {blog.seo_score}/100</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link to={`/blog/${blog.id}`}>
                                            <Button variant="outline" size="sm" className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200">
                                                <Eye className="h-4 w-4 mr-1" /> View
                                            </Button>
                                        </Link>
                                        <Link to={`/editor/${blog.id}`}>
                                            <Button variant="outline" size="sm"><Edit className="h-4 w-4" /></Button>
                                        </Link>
                                        <Button variant="outline" size="sm" onClick={() => handleDelete(blog.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
