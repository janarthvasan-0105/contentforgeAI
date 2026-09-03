import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FolderOpen, Plus } from 'lucide-react';

export default function TopicCategorySection({
    formData,
    handleChange,
    groupedCategories,
    isBulkMode,
    setIsAddCategoryOpen,
    formatCategoryValue
}) {
    return (
        <Card className="shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center space-x-3 pb-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                    <CardTitle className="text-lg font-bold text-gray-800">1. Topic & Category</CardTitle>
                    <p className="text-xs text-gray-500">Specify your main blog topic and target category.</p>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="topic" className="text-sm font-semibold text-gray-700">
                            Topic <span className="text-gray-400 text-xs font-normal">(leave empty for auto-bulk)</span>
                        </Label>
                        <Input
                            id="topic"
                            name="topic"
                            placeholder="e.g. Future of AI — or leave empty for bulk mode"
                            value={formData.topic}
                            onChange={handleChange}
                            className="w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="category" className="text-sm font-semibold text-gray-700">Category</Label>
                            <button
                                type="button"
                                onClick={() => setIsAddCategoryOpen(true)}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> Add Category
                            </button>
                        </div>
                        <select
                            id="category"
                            name="category"
                            required
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            value={formData.category}
                            onChange={handleChange}
                        >
                            <option value="" disabled>Select a Category...</option>
                            {Object.entries(groupedCategories).map(([group, cats]) => (
                                <optgroup key={group} label={group}>
                                    {cats.map(cat => {
                                        const val = formatCategoryValue(cat);
                                        return (
                                            <option key={cat.id || cat.category_name} value={val}>
                                                {cat.icon ? `${cat.icon} ` : ''}{cat.category_name}
                                            </option>
                                        );
                                    })}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                </div>

                {isBulkMode && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 animate-in fade-in duration-200">
                        <strong>🚀 Bulk Mode Active:</strong> {formData.numBlogs} unique topic(s) will be auto-generated for <strong>{formData.category}</strong> and blogs will be created automatically.
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="numBlogs" className="text-sm font-semibold text-gray-700">Number of Blogs</Label>
                        <Input
                            id="numBlogs"
                            name="numBlogs"
                            type="number"
                            min="1"
                            max="100"
                            required
                            value={formData.numBlogs}
                            onChange={handleChange}
                            className="w-full"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
