import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
    runResearchAgent,
    generateSingleBlogAgent,
    generateBulkTopics
} from '../agents';
import { supabase } from '../supabase/client';
import { Download, Save, Send, Edit, Eye, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { marked } from 'marked';
import { getCategories, addCategory } from '../services/categoryService';
import EmojiPicker from 'emoji-picker-react';
import TopicCategorySection from '../components/blog-generator/TopicCategorySection';
import ContentSettingsSection from '../components/blog-generator/ContentSettingsSection';
import SEOContentSection from '../components/blog-generator/SEOContentSection';

export default function BlogGeneratorPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [generatedBlogs, setGeneratedBlogs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
    const [newCategoryData, setNewCategoryData] = useState({
        groupName: '',
        customGroupName: '',
        categoryName: '',
        topicIdeas: '',
        targetAudience: '',
        icon: ''
    });
    const [categoryError, setCategoryError] = useState('');
    const [savingCategory, setSavingCategory] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        const cats = await getCategories();
        setCategories(cats);
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

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        setCategoryError('');
        
        const finalGroup = newCategoryData.groupName === 'NEW' 
            ? newCategoryData.customGroupName.trim() 
            : newCategoryData.groupName.trim();
        
        const finalCategory = newCategoryData.categoryName.trim();
        
        if (!finalGroup) {
            setCategoryError('Group name is required.');
            return;
        }
        if (!finalCategory) {
            setCategoryError('Category name is required.');
            return;
        }

        setSavingCategory(true);
        try {
            await addCategory({
                group_name: finalGroup,
                category_name: finalCategory,
                topic_ideas: newCategoryData.topicIdeas.trim() || null,
                target_audience: newCategoryData.targetAudience.trim() || null,
                icon: newCategoryData.icon.trim() || null
            });
            
            const cats = await getCategories();
            setCategories(cats);
            
            const newCatObj = {
                group_name: finalGroup,
                category_name: finalCategory,
                icon: newCategoryData.icon.trim() || null
            };
            const val = formatCategoryValue(newCatObj);
            setFormData(prev => ({ ...prev, category: val }));

            setNewCategoryData({
                groupName: '',
                customGroupName: '',
                categoryName: '',
                topicIdeas: '',
                targetAudience: '',
                icon: ''
            });
            setIsAddCategoryOpen(false);
        } catch (err) {
            setCategoryError(err.message || 'Failed to add category to the database.');
        } finally {
            setSavingCategory(false);
        }
    };

    // Bulk generation state
    const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
    const [bulkResult, setBulkResult] = useState(null); // { success: number, failed: number, failedItems: [] }
    const [retrying, setRetrying] = useState(false);

    const [formData, setFormData] = useState({
        topic: '',
        category: '',
        numBlogs: 1,
        length: 'medium',
        tone: 'professional',
        audience: 'general',
        seoLevel: 'high',
        contentElements: {
            faq: false,
            cta: false,
            keyTakeaways: false
        }
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCheckboxChange = (e) => {
        setFormData({
            ...formData,
            contentElements: {
                ...formData.contentElements,
                [e.target.name]: e.target.checked
            }
        });
    };

    const generateAndSaveSingleBlog = async (topic, category, activeElements, researchData, maxTokens) => {
        const finalContent = await generateSingleBlogAgent({
            topic,
            length: formData.length,
            tone: formData.tone,
            audience: formData.audience,
            seoLevel: formData.seoLevel,
            contentElements: activeElements,
            researchData,
            maxTokens
        });

        let extractedTitle = topic;
        const firstLine = finalContent.trim().split('\n')[0];
        if (firstLine && firstLine.startsWith('#')) {
            extractedTitle = firstLine.replace(/^#+\s*/, '').substring(0, 100).trim();
        }

        const finalHtmlContent = marked.parse(finalContent);

        const cleanCategory = category.substring(category.indexOf(' ') + 1).trim();

        const { data, error } = await supabase
            .from('blogs')
            .insert([{
                title: extractedTitle,
                topic: topic,
                category: cleanCategory,
                content: finalHtmlContent,
                seo_score: 85,
                status: 'draft'
            }])
            .select();

        if (error) {
            console.error("DB Insert Error", error);
            throw new Error(error.message || 'Database insert failed');
        }

        return data && data.length > 0 ? data[0] : null;
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGeneratedBlogs([]);
        setBulkResult(null);
        setBulkProgress({ current: 0, total: 0 });

        const isBulkMode = !formData.topic.trim();
        const numBlogsNum = parseInt(formData.numBlogs, 10) || 1;

        try {
            const activeElements = Object.entries(formData.contentElements)
                .filter(([_, isActive]) => isActive)
                .map(([name]) => name);

            const maxTokens = formData.length === 'long' ? 1500 : 1200;

            if (isBulkMode) {
                // ── BULK MODE: Auto-generate topics ──
                setStatus(`Generating ${numBlogsNum} unique topics for ${formData.category}...`);
                setBulkProgress({ current: 0, total: numBlogsNum });

                // Generate topics in batches (max 20 per Groq call to stay reliable)
                let allTopics = [];
                const usedTopics = [];
                const batchSize = Math.min(numBlogsNum, 20);
                let remaining = numBlogsNum;

                while (allTopics.length < numBlogsNum) {
                    const batchCount = Math.min(batchSize, remaining);
                    const newTopics = await generateBulkTopics(formData.category, batchCount, usedTopics);
                    // Deduplicate
                    for (const t of newTopics) {
                        const normalized = t.toLowerCase().trim();
                        if (!usedTopics.includes(normalized)) {
                            usedTopics.push(normalized);
                            allTopics.push(t);
                        }
                    }
                    remaining = numBlogsNum - allTopics.length;
                    if (remaining <= 0) break;
                }

                allTopics = allTopics.slice(0, numBlogsNum);
                console.log(`[Bulk] Generated ${allTopics.length} topics:`, allTopics);

                const newBlogs = [];
                const failedItems = [];

                for (let i = 0; i < allTopics.length; i++) {
                    const currentTopic = allTopics[i];
                    setStatus(`Generating Blog ${i + 1}/${allTopics.length}...`);
                    setBulkProgress({ current: i + 1, total: allTopics.length });

                    try {
                        // Research for each topic
                        setStatus(`Researching "${currentTopic}" (${i + 1}/${allTopics.length})...`);
                        const researchData = await runResearchAgent(currentTopic);

                        setStatus(`Writing Blog ${i + 1}/${allTopics.length}: "${currentTopic}"...`);
                        const saved = await generateAndSaveSingleBlog(
                            currentTopic, formData.category, activeElements, researchData, maxTokens
                        );

                        if (saved) {
                            newBlogs.push(saved);
                            setGeneratedBlogs([...newBlogs]);
                        }
                    } catch (err) {
                        console.error(`[Bulk] Failed on blog ${i + 1} ("${currentTopic}"):`, err);
                        failedItems.push({ topic: currentTopic, error: err.message });
                    }
                }

                setLoading(false);
                setBulkResult({
                    success: newBlogs.length,
                    failed: failedItems.length,
                    failedItems
                });

            } else {
                // ── SINGLE / MANUAL MODE (existing behavior) ──
                setStatus('Gathering facts (Tavily Research)...');
                const researchData = await runResearchAgent(formData.topic);

                const newBlogs = [];

                for (let i = 0; i < numBlogsNum; i++) {
                    setStatus(`Generating Blog ${i + 1} of ${numBlogsNum} (Groq)...`);

                    try {
                        const saved = await generateAndSaveSingleBlog(
                            formData.topic, formData.category, activeElements, researchData, maxTokens
                        );
                        if (saved) newBlogs.push(saved);
                    } catch (err) {
                        console.error(`Error generating blog ${i + 1}:`, err);
                    }
                }

                setLoading(false);
                setGeneratedBlogs(newBlogs);
            }

        } catch (error) {
            console.error(error);
            alert('Error during generation: ' + error.message);
            setLoading(false);
        }
    };

    const handleRetryFailed = async () => {
        if (!bulkResult || bulkResult.failedItems.length === 0) return;
        setRetrying(true);
        setLoading(true);

        const failedItems = [...bulkResult.failedItems];
        const activeElements = Object.entries(formData.contentElements)
            .filter(([_, isActive]) => isActive)
            .map(([name]) => name);
        const maxTokens = formData.length === 'long' ? 1500 : 1200;

        const retriedBlogs = [];
        const stillFailed = [];

        for (let i = 0; i < failedItems.length; i++) {
            const { topic } = failedItems[i];
            setStatus(`Retrying "${topic}" (${i + 1}/${failedItems.length})...`);
            setBulkProgress({ current: i + 1, total: failedItems.length });

            try {
                const researchData = await runResearchAgent(topic);
                const saved = await generateAndSaveSingleBlog(
                    topic, formData.category, activeElements, researchData, maxTokens
                );
                if (saved) retriedBlogs.push(saved);
            } catch (err) {
                console.error(`[Retry] Failed again for "${topic}":`, err);
                stillFailed.push({ topic, error: err.message });
            }
        }

        setGeneratedBlogs(prev => [...prev, ...retriedBlogs]);
        setBulkResult(prev => ({
            success: prev.success + retriedBlogs.length,
            failed: stillFailed.length,
            failedItems: stillFailed
        }));
        setLoading(false);
        setRetrying(false);
    };

    const handleDownload = (blog) => {
        const blob = new Blob([blog.content], { type: 'text/markdown' });
        const link = window.document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `${blog.title.substring(0, 30)}.md`;
        link.click();
    };

    const handlePublish = async (id) => {
        try {
            await supabase.from('blogs').update({ status: 'published' }).eq('id', id);
            setGeneratedBlogs(prev => prev.map(b => b.id === id ? { ...b, status: 'published' } : b));
            alert('Blog published successfully!');
        } catch (err) {
            alert('Publish error: ' + err.message);
        }
    };

    const handleSaveDraft = async (id) => {
        try {
            await supabase.from('blogs').update({ status: 'draft' }).eq('id', id);
            setGeneratedBlogs(prev => prev.map(b => b.id === id ? { ...b, status: 'draft' } : b));
            alert('Saved to drafts!');
        } catch (err) {
            alert('Save draft error: ' + err.message);
        }
    };

    const isBulkMode = !formData.topic.trim() && formData.category;

    const groupedCategories = categories.reduce((acc, cat) => {
        const group = cat.group_name;
        if (!acc[group]) {
            acc[group] = [];
        }
        acc[group].push(cat);
        return acc;
    }, {});

    return (
        <div className="max-w-6xl mx-auto py-10 px-4">
            {!loading && generatedBlogs.length === 0 && !bulkResult && (
                <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
                    <div className="text-center space-y-2 mb-2">
                        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 inline-block text-transparent bg-clip-text">
                            Configure Blog
                        </h1>
                        <p className="text-gray-500 text-sm max-w-md mx-auto">
                            Setup your options across three independent configurations to generate optimized, ready-to-publish blog content.
                        </p>
                    </div>

                    <form onSubmit={handleGenerate} className="space-y-6">
                        <TopicCategorySection
                            formData={formData}
                            handleChange={handleChange}
                            groupedCategories={groupedCategories}
                            isBulkMode={isBulkMode}
                            setIsAddCategoryOpen={setIsAddCategoryOpen}
                            formatCategoryValue={formatCategoryValue}
                        />

                        <ContentSettingsSection
                            formData={formData}
                            handleChange={handleChange}
                        />

                        <SEOContentSection
                            formData={formData}
                            handleChange={handleChange}
                            handleCheckboxChange={handleCheckboxChange}
                        />

                        <Button type="submit" className="w-full text-lg shadow-md py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all font-semibold" size="lg" disabled={!formData.category}>
                            {isBulkMode ? `🚀 Bulk Generate ${formData.numBlogs} Blog(s)` : 'Generate Blog(s)'}
                        </Button>
                    </form>
                </div>
            )}

            {loading && (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
                    <p className="text-xl font-medium text-gray-700 animate-pulse">{status}</p>
                    {bulkProgress.total > 1 && (
                        <div className="w-full max-w-md">
                            <div className="flex justify-between text-sm text-gray-500 mb-1">
                                <span>Progress</span>
                                <span>{bulkProgress.current}/{bulkProgress.total}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Bulk Completion Summary */}
            {!loading && bulkResult && (
                <div className="max-w-2xl mx-auto mb-8">
                    <Card className={`border-t-4 ${bulkResult.failed > 0 ? 'border-t-yellow-500' : 'border-t-green-500'}`}>
                        <CardContent className="p-6 text-center space-y-4">
                            {bulkResult.failed === 0 ? (
                                <p className="text-2xl font-bold text-green-700">
                                    ✅ Successfully generated {bulkResult.success} blog{bulkResult.success !== 1 ? 's' : ''}.
                                </p>
                            ) : (
                                <>
                                    <p className="text-xl font-bold text-gray-800">
                                        Generated {bulkResult.success} blog{bulkResult.success !== 1 ? 's' : ''} successfully.
                                    </p>
                                    <p className="text-lg text-red-600 font-medium">
                                        {bulkResult.failed} blog{bulkResult.failed !== 1 ? 's' : ''} failed.
                                    </p>
                                    <Button
                                        onClick={handleRetryFailed}
                                        disabled={retrying}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                    >
                                        <RefreshCw className={`w-4 h-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
                                        Retry failed blogs?
                                    </Button>
                                </>
                            )}
                            <div className="flex gap-3 justify-center mt-4">
                                <Button variant="outline" onClick={() => { setGeneratedBlogs([]); setBulkResult(null); }}>
                                    Generate More
                                </Button>
                                <Link to="/drafts">
                                    <Button>View All Blogs</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {!loading && generatedBlogs.length > 0 && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                            Generated Blogs ({generatedBlogs.length})
                        </h2>
                        {!bulkResult && (
                            <Button variant="outline" onClick={() => setGeneratedBlogs([])}>Generate More</Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {generatedBlogs.map((blog, idx) => (
                            <Card key={blog.id} className="flex flex-col shadow-lg border-t-4 border-t-blue-500 hover:shadow-xl transition-shadow relative">
                                <div className="absolute -top-3 -left-3 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-md">
                                    {idx + 1}
                                </div>
                                <CardHeader>
                                    <CardTitle className="text-xl line-clamp-2" title={blog.title}>{blog.title}</CardTitle>
                                    <p className="text-sm text-gray-500 mt-1">Status: <span className="capitalize font-medium text-gray-700">{blog.status}</span> | SEO: {blog.seo_score}</p>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <div
                                        className="bg-gray-50 p-4 rounded-md text-sm text-gray-600 line-clamp-6 h-32 overflow-hidden border whitespace-normal"
                                        dangerouslySetInnerHTML={{ __html: blog.content }}
                                    ></div>
                                </CardContent>
                                <CardFooter className="flex flex-wrap gap-2 pt-4 border-t bg-gray-50 rounded-b-lg">
                                    <Link to={`/blog/${blog.id}`} className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200">
                                            <Eye className="w-4 h-4 mr-2" /> View
                                        </Button>
                                    </Link>
                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/editor/${blog.id}`)}>
                                        <Edit className="w-4 h-4 mr-2" /> Edit
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDownload(blog)}>
                                        <Download className="w-4 h-4 mr-2" /> DL
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleSaveDraft(blog.id)}>
                                        <Save className="w-4 h-4 mr-2" /> Draft
                                    </Button>
                                    <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handlePublish(blog.id)}>
                                        <Send className="w-4 h-4 mr-2" /> Publish
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {isAddCategoryOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-md shadow-2xl border-gray-100 bg-white">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 inline-block text-transparent bg-clip-text">
                                Add Custom Category
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSaveCategory} className="space-y-4">
                                {categoryError && (
                                    <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg p-3">
                                        {categoryError}
                                    </div>
                                )}
                                
                                <div className="space-y-2">
                                    <Label htmlFor="modalGroupName">Category Group</Label>
                                    <select
                                        id="modalGroupName"
                                        required
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        value={newCategoryData.groupName}
                                        onChange={(e) => setNewCategoryData({ ...newCategoryData, groupName: e.target.value })}
                                    >
                                        <option value="" disabled>Select Group...</option>
                                        {Array.from(new Set(categories.map(c => c.group_name))).map(group => (
                                            <option key={group} value={group}>{group}</option>
                                        ))}
                                        <option value="NEW">+ Create New Group...</option>
                                    </select>
                                </div>

                                {newCategoryData.groupName === 'NEW' && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                        <Label htmlFor="customGroupName">New Group Name</Label>
                                        <Input
                                            id="customGroupName"
                                            placeholder="e.g. PetCare (Pets)"
                                            value={newCategoryData.customGroupName}
                                            onChange={(e) => setNewCategoryData({ ...newCategoryData, customGroupName: e.target.value })}
                                            required
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="categoryName">Category Name</Label>
                                    <Input
                                        id="categoryName"
                                        placeholder="e.g. Diet Tips"
                                        value={newCategoryData.categoryName}
                                        onChange={(e) => setNewCategoryData({ ...newCategoryData, categoryName: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="topicIdeas">Blog Topic Ideas <span className="text-gray-400 text-xs">(comma separated, optional)</span></Label>
                                    <textarea
                                        id="topicIdeas"
                                        placeholder="e.g. Best pet foods, walking routines, training guides"
                                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none"
                                        value={newCategoryData.topicIdeas}
                                        onChange={(e) => setNewCategoryData({ ...newCategoryData, topicIdeas: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="targetAudience">Target Audience <span className="text-gray-400 text-xs">(optional)</span></Label>
                                    <Input
                                        id="targetAudience"
                                        placeholder="e.g. Dog owners"
                                        value={newCategoryData.targetAudience}
                                        onChange={(e) => setNewCategoryData({ ...newCategoryData, targetAudience: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="icon">Icon/Emoji <span className="text-gray-400 text-xs">(optional)</span></Label>
                                    <div className="flex gap-2 relative">
                                        <Input
                                            id="icon"
                                            placeholder="e.g. 🐕"
                                            value={newCategoryData.icon}
                                            onChange={(e) => setNewCategoryData({ ...newCategoryData, icon: e.target.value })}
                                            className="flex-1"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            className="h-10 w-10 flex items-center justify-center border border-input rounded-md hover:bg-gray-100 transition-colors text-lg bg-background"
                                            title="Pick Emoji"
                                        >
                                            {newCategoryData.icon || '😀'}
                                        </button>
                                        
                                        {showEmojiPicker && (
                                            <div 
                                                className="absolute right-0 bottom-12 z-50 shadow-2xl border rounded-lg bg-white overflow-hidden"
                                                onWheel={(e) => e.stopPropagation()}
                                                onTouchStart={(e) => e.stopPropagation()}
                                                onTouchMove={(e) => e.stopPropagation()}
                                                onTouchEnd={(e) => e.stopPropagation()}
                                            >
                                                <EmojiPicker
                                                    onEmojiClick={(emojiObj) => {
                                                        setNewCategoryData(prev => ({ ...prev, icon: emojiObj.emoji }));
                                                        setShowEmojiPicker(false);
                                                    }}
                                                    width={320}
                                                    height={380}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setIsAddCategoryOpen(false);
                                            setCategoryError('');
                                        }}
                                        disabled={savingCategory}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                        disabled={savingCategory}
                                    >
                                        {savingCategory ? 'Saving...' : 'Save Category'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
