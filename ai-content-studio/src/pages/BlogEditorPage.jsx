import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '../supabase/client';
import { Download, Save, Send, Copy, RefreshCw, Bold, Italic, Heading1, Heading2, List, Link2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { marked } from 'marked';
import TurndownService from 'turndown';

export default function BlogEditorPage() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const editorRef = useRef(null);

    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [saving, setSaving] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [publishPlatform, setPublishPlatform] = useState('wordpress');

    // Substack integration states
    const [publishing, setPublishing] = useState(false);
    const [publishProgress, setPublishProgress] = useState([]);
    const [publishError, setPublishError] = useState(null);
    const [publishUrl, setPublishUrl] = useState(null);
    const [substackCookie, setSubstackCookie] = useState('');

    useEffect(() => {
        const savedCookie = localStorage.getItem('substack_cookie') || '';
        setSubstackCookie(savedCookie);
    }, []);

    useEffect(() => {
        if (id && id !== 'new') {
            fetchBlog(id);
        } else if (location.state) {
            setContent(location.state.content || '');
            setTitle(location.state.title || '');
        }
    }, [id, location.state]);

    const fetchBlog = async (blogId) => {
        const { data } = await supabase
            .from('blogs')
            .select('*')
            .eq('id', blogId)
            .single();

        if (data) {
            setTitle(data.title);
            const turndownService = new TurndownService({
                headingStyle: 'atx',
                codeBlockStyle: 'fenced'
            });
            // Try catching just in case it's already markdown or fails
            try {
                // If it contains typical HTML tags, convert it
                if (/<[a-z][\s\S]*>/i.test(data.content)) {
                    setContent(turndownService.turndown(data.content));
                } else {
                    setContent(data.content);
                }
            } catch (e) {
                setContent(data.content);
            }
        }
    };

    const insertMarkdown = (before, after = '') => {
        const el = editorRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const selected = content.substring(start, end);
        const newText = content.substring(0, start) + before + selected + after + content.substring(end);
        setContent(newText);
        setTimeout(() => {
            el.focus();
            el.selectionStart = start + before.length;
            el.selectionEnd = start + before.length + selected.length;
        }, 0);
    };

    const handleSaveDraft = async () => {
        setSaving(true);
        try {
            const htmlContent = marked.parse(content);
            if (id === 'new') {
                const { data } = await supabase
                    .from('blogs')
                    .insert([{ title, content: htmlContent, status: 'draft' }])
                    .select();
                if (data && data[0]) {
                    navigate(`/editor/${data[0].id}`, { replace: true });
                }
            } else {
                await supabase
                    .from('blogs')
                    .update({ title, content: htmlContent, status: 'draft' })
                    .eq('id', id);
            }
            alert('Draft saved!');
        } catch (err) {
            alert('Error saving draft: ' + err.message);
        }
        setSaving(false);
    };

    const handleSchedule = async () => {
        if (!scheduleDate) {
            alert('Please select a schedule date');
            return;
        }
        try {
            await supabase.from('scheduled_posts').insert([{
                blog_id: id !== 'new' ? id : null,
                publish_date: new Date(scheduleDate).toISOString(),
                platform: publishPlatform,
                status: 'pending'
            }]);
            alert(`Scheduled for ${scheduleDate} on ${publishPlatform}`);
        } catch (err) {
            alert('Scheduling error: ' + err.message);
        }
    };

    const handleSubstackPublish = async () => {
        setPublishProgress(['Initiating connection to publisher...']);
        setPublishing(true);
        setPublishError(null);
        setPublishUrl(null);

        // Save cookie to localStorage if provided
        if (substackCookie.trim()) {
            localStorage.setItem('substack_cookie', substackCookie.trim());
        }

        try {
            const response = await fetch('/api/publish/substack', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, content, cookie: substackCookie }),
            });

            if (!response.ok) {
                throw new Error(`Failed to initialize publishing: ${response.statusText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep partial line in buffer

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const message = JSON.parse(line);
                            if (message.type === 'status') {
                                let statusText = '';
                                switch (message.status) {
                                    case 'INIT_SESSION':
                                        statusText = 'Checking Substack session...';
                                        break;
                                    case 'AUTH_SUCCESS':
                                        statusText = 'Session authenticated successfully.';
                                        break;
                                    case 'SESSION_EXPIRED':
                                        statusText = 'Session expired. Manual sign-in required.';
                                        break;
                                    case 'NO_SESSION':
                                        statusText = 'No session found. Manual sign-in required.';
                                        break;
                                    case 'AWAITING_LOGIN':
                                        statusText = '⚠️ Manual Login Required: Please sign in to Substack in the browser window that just opened.';
                                        break;
                                    case 'LOGIN_SUCCESS':
                                        statusText = 'Logged in successfully! Saving session...';
                                        break;
                                    case 'NAVIGATING_EDITOR':
                                        statusText = 'Navigating to post editor...';
                                        break;
                                    case 'PREPARING_POST':
                                        statusText = 'Entering title and writing content...';
                                        break;
                                    case 'PUBLISHING':
                                        statusText = 'Clicking publish...';
                                        break;
                                    case 'CONFIRMING_PUBLISH':
                                        statusText = 'Sending post to audience...';
                                        break;
                                    case 'FINALIZING':
                                        statusText = 'Finalizing publication...';
                                        break;
                                    case 'PUBLISH_COMPLETE':
                                        statusText = 'Published successfully!';
                                        break;
                                    default:
                                        statusText = message.details || message.status;
                                }
                                setPublishProgress(prev => [...prev, statusText]);
                            } else if (message.type === 'success') {
                                setPublishUrl(message.url);
                                setPublishProgress(prev => [...prev, 'Publication completed! Saving record...']);

                                // Save to database (try schema-native URL column first, fallback to serialized platform name)
                                try {
                                    const { error: insertError } = await supabase.from('published_posts').insert([{
                                        blog_id: id !== 'new' ? id : null,
                                        platform: 'substack',
                                        url: message.url
                                    }]);

                                    if (insertError) {
                                        await supabase.from('published_posts').insert([{
                                            blog_id: id !== 'new' ? id : null,
                                            platform: `substack|${message.url}`
                                        }]);
                                    }
                                } catch (dbErr) {
                                    await supabase.from('published_posts').insert([{
                                        blog_id: id !== 'new' ? id : null,
                                        platform: `substack|${message.url}`
                                    }]);
                                }

                                if (id && id !== 'new') {
                                    await supabase.from('blogs').update({ status: 'published' }).eq('id', id);
                                }
                            } else if (message.type === 'error') {
                                throw new Error(message.error);
                            }
                        } catch (e) {
                            console.error('Error parsing stream line:', e, line);
                        }
                    }
                }
            }
        } catch (err) {
            setPublishError(err.message);
            setPublishProgress(prev => [...prev, `❌ Error: ${err.message}`]);
        } finally {
            setPublishing(false);
        }
    };

    const handlePublish = async () => {
        if (publishPlatform === 'substack') {
            await handleSubstackPublish();
            return;
        }

        try {
            if (id && id !== 'new') {
                await supabase.from('published_posts').insert([{
                    blog_id: id,
                    platform: publishPlatform,
                }]);
                await supabase.from('blogs').update({ status: 'published' }).eq('id', id);
            }
            alert(`Published to ${publishPlatform}! (Platform API integration placeholder)`);
        } catch (err) {
            alert('Publish error: ' + err.message);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        alert('Copied to clipboard!');
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(title, 10, 15);
        doc.setFontSize(11);
        const plainText = content.replace(/[#*_`>\-]/g, '');
        const lines = doc.splitTextToSize(plainText, 180);
        doc.text(lines, 10, 25);
        doc.save(`${title.substring(0, 30)}.pdf`);
    };

    const handleDownloadDocx = async () => {
        const plainText = content.replace(/[#*_`>\-]/g, '');
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 32 })] }),
                    ...plainText.split('\n').map(line =>
                        new Paragraph({ children: [new TextRun(line)] })
                    )
                ],
            }],
        });
        const blob = await Packer.toBlob(doc);
        const link = window.document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `${title.substring(0, 30)}.docx`;
        link.click();
    };

    const handleDownloadMarkdown = () => {
        const blob = new Blob([`# ${title}\n\n${content}`], { type: 'text/markdown' });
        const link = window.document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `${title.substring(0, 30)}.md`;
        link.click();
    };

    const handleDownloadHTML = () => {
        const htmlContent = `<!DOCTYPE html><html><head><title>${title}</title></head><body><h1>${title}</h1><pre>${content}</pre></body></html>`;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const link = window.document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `${title.substring(0, 30)}.html`;
        link.click();
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Editor Column */}
            <div className="lg:col-span-3 space-y-4">
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-2xl font-bold h-14 border-2"
                    placeholder="Blog Title"
                />

                {/* Toolbar */}
                <div className="flex items-center gap-1 p-2 bg-white rounded-lg border shadow-sm flex-wrap">
                    <button onClick={() => insertMarkdown('**', '**')} className="p-2 hover:bg-gray-100 rounded" title="Bold"><Bold className="h-4 w-4" /></button>
                    <button onClick={() => insertMarkdown('*', '*')} className="p-2 hover:bg-gray-100 rounded" title="Italic"><Italic className="h-4 w-4" /></button>
                    <button onClick={() => insertMarkdown('# ')} className="p-2 hover:bg-gray-100 rounded" title="Heading 1"><Heading1 className="h-4 w-4" /></button>
                    <button onClick={() => insertMarkdown('## ')} className="p-2 hover:bg-gray-100 rounded" title="Heading 2"><Heading2 className="h-4 w-4" /></button>
                    <button onClick={() => insertMarkdown('- ')} className="p-2 hover:bg-gray-100 rounded" title="List"><List className="h-4 w-4" /></button>
                    <button onClick={() => insertMarkdown('[', '](url)')} className="p-2 hover:bg-gray-100 rounded" title="Link"><Link2 className="h-4 w-4" /></button>
                </div>

                {/* Textarea Editor */}
                <textarea
                    ref={editorRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-[65vh] p-4 bg-white rounded-lg border shadow-sm font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your blog content will appear here..."
                />
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
                <Card>
                    <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <Button className="w-full justify-start" variant="outline" onClick={handleSaveDraft} disabled={saving}>
                            <Save className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : 'Save Draft'}
                        </Button>
                        <Button className="w-full justify-start" variant="outline" onClick={handleCopy}>
                            <Copy className="mr-2 h-4 w-4" /> Copy Content
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                            <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Export</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <Button className="w-full justify-start" variant="secondary" onClick={handleDownloadPDF}>
                            <Download className="mr-2 h-4 w-4" /> PDF
                        </Button>
                        <Button className="w-full justify-start" variant="secondary" onClick={handleDownloadDocx}>
                            <Download className="mr-2 h-4 w-4" /> DOCX
                        </Button>
                        <Button className="w-full justify-start" variant="secondary" onClick={handleDownloadMarkdown}>
                            <Download className="mr-2 h-4 w-4" /> Markdown
                        </Button>
                        <Button className="w-full justify-start" variant="secondary" onClick={handleDownloadHTML}>
                            <Download className="mr-2 h-4 w-4" /> HTML
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Publish</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <label className="text-sm font-medium">Platform</label>
                        <select
                            value={publishPlatform}
                            onChange={(e) => setPublishPlatform(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                        >
                            <option value="wordpress">WordPress</option>
                            <option value="medium">Medium</option>
                            <option value="blogger">Blogger</option>
                            <option value="ghost">Ghost</option>
                            <option value="hashnode">Hashnode</option>
                            <option value="devto">Dev.to</option>
                            <option value="shopify">Shopify</option>
                            <option value="notion">Notion</option>
                            <option value="substack">Substack</option>
                        </select>

                        {publishPlatform === 'substack' && (
                            <div className="space-y-2 border-t pt-3 mt-1">
                                <label className="text-xs font-semibold text-orange-600 block">
                                    Substack Session Cookie (substack.sid) - Optional fallback
                                </label>
                                <Input
                                    type="password"
                                    value={substackCookie}
                                    onChange={(e) => setSubstackCookie(e.target.value)}
                                    placeholder="Paste your substack.sid cookie here"
                                    className="h-9 text-xs"
                                />
                                <div className="text-[10px] text-gray-500 leading-normal">
                                    <strong>How to get it:</strong> Sign in to Substack.com in your browser. Open DevTools (F12) &gt; Storage/Application &gt; Cookies &gt; substack.com &gt; Copy the value of <code>substack.sid</code>.
                                </div>
                            </div>
                        )}

                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2" onClick={handlePublish}>
                            <Send className="mr-2 h-4 w-4" /> Publish Now
                        </Button>

                        <hr className="my-1" />
                        <label className="text-sm font-medium">Schedule</label>
                        <input
                            type="datetime-local"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                        />
                        <Button className="w-full" variant="outline" onClick={handleSchedule}>
                            Schedule Later
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {publishing && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg shadow-2xl bg-white border border-gray-100">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-700 inline-block text-transparent bg-clip-text flex items-center gap-2">
                                <Send className="h-5 w-5 animate-pulse text-orange-600" />
                                Publishing to Substack
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-center py-6">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500"></div>
                            </div>
                            <div className="bg-gray-50 border rounded-lg p-4 max-h-60 overflow-y-auto font-mono text-xs space-y-2">
                                {publishProgress.map((step, idx) => (
                                    <div key={idx} className={idx === publishProgress.length - 1 ? "text-orange-600 font-semibold animate-pulse" : "text-gray-500"}>
                                        &gt; {step}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {(publishUrl || publishError) && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md shadow-2xl bg-white border border-gray-100 animate-in zoom-in-95 duration-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl font-bold">
                                {publishUrl ? '🎉 Post Published!' : '❌ Publishing Failed'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {publishUrl ? (
                                <>
                                    <p className="text-sm text-gray-600">
                                        Your blog post has been successfully published to Substack!
                                    </p>
                                    <div className="bg-gray-50 border rounded-lg p-3 text-xs break-all text-blue-600 underline font-medium">
                                        <a href={publishUrl} target="_blank" rel="noopener noreferrer">
                                            {publishUrl}
                                        </a>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-red-600 font-medium">
                                    {publishError}
                                </p>
                            )}
                            <div className="flex justify-end pt-2">
                                <Button onClick={() => { setPublishUrl(null); setPublishError(null); }} className="bg-orange-600 hover:bg-orange-700 text-white">
                                    Dismiss
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
