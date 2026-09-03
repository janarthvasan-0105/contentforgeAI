import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/blog-generator/ui/card';
import { Label } from '@/components/blog-generator/ui/label';
import { Sparkles } from 'lucide-react';

export default function SEOContentSection({
    formData,
    handleChange,
    handleCheckboxChange
}) {
    return (
        <Card className="bg-white rounded-xl shadow-sm border border-black/5">
            <CardHeader className="flex flex-row items-center space-x-3 pb-3">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <Sparkles className="w-5 h-5" />
                </div>
                <div>
                    <CardTitle className="text-lg font-bold text-neutral-900">3. SEO & Content Elements</CardTitle>
                    <p className="text-xs text-neutral-500">Configure search optimization and interactive text elements.</p>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="seoLevel" className="text-sm font-semibold text-neutral-700 flex items-center gap-1 text-neutral-900">SEO Level</Label>
                        <select
                            id="seoLevel"
                            name="seoLevel"
                            className="flex h-10 w-full rounded-md w-full h-10 px-3 py-2 rounded-md border border-neutral-200 bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#8763e5]/50 focus:border-[#8763e5] transition-all px-3 py-2 text-sm ring-offset-background"
                            value={formData.seoLevel}
                            onChange={handleChange}
                        >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="basic">Basic</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-sm font-semibold text-neutral-700 flex items-center gap-1 text-neutral-900">Content Elements</Label>
                    <div className="flex flex-wrap gap-4 pt-1">
                        <label className="flex items-center space-x-2 text-sm text-neutral-600 hover:text-gray-900 cursor-pointer">
                            <input
                                type="checkbox"
                                name="faq"
                                checked={formData.contentElements.faq}
                                onChange={handleCheckboxChange}
                                className="rounded border-neutral-200 text-[#8763e5] focus:ring-blue-500 h-4 w-4"
                            />
                            <span>FAQ Section</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm text-neutral-600 hover:text-gray-900 cursor-pointer">
                            <input
                                type="checkbox"
                                name="cta"
                                checked={formData.contentElements.cta}
                                onChange={handleCheckboxChange}
                                className="rounded border-neutral-200 text-[#8763e5] focus:ring-blue-500 h-4 w-4"
                            />
                            <span>Call To Action</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm text-neutral-600 hover:text-gray-900 cursor-pointer">
                            <input
                                type="checkbox"
                                name="keyTakeaways"
                                checked={formData.contentElements.keyTakeaways}
                                onChange={handleCheckboxChange}
                                className="rounded border-neutral-200 text-[#8763e5] focus:ring-blue-500 h-4 w-4"
                            />
                            <span>Key Takeaways</span>
                        </label>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
