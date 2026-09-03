import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';

export default function SEOContentSection({
    formData,
    handleChange,
    handleCheckboxChange
}) {
    return (
        <Card className="shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center space-x-3 pb-3">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <Sparkles className="w-5 h-5" />
                </div>
                <div>
                    <CardTitle className="text-lg font-bold text-gray-800">3. SEO & Content Elements</CardTitle>
                    <p className="text-xs text-gray-500">Configure search optimization and interactive text elements.</p>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="seoLevel" className="text-sm font-semibold text-gray-700">SEO Level</Label>
                        <select
                            id="seoLevel"
                            name="seoLevel"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
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
                    <Label className="text-sm font-semibold text-gray-700">Content Elements</Label>
                    <div className="flex flex-wrap gap-4 pt-1">
                        <label className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                            <input
                                type="checkbox"
                                name="faq"
                                checked={formData.contentElements.faq}
                                onChange={handleCheckboxChange}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                            <span>FAQ Section</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                            <input
                                type="checkbox"
                                name="cta"
                                checked={formData.contentElements.cta}
                                onChange={handleCheckboxChange}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                            <span>Call To Action</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                            <input
                                type="checkbox"
                                name="keyTakeaways"
                                checked={formData.contentElements.keyTakeaways}
                                onChange={handleCheckboxChange}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                            <span>Key Takeaways</span>
                        </label>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
