import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/blog-generator/ui/card';
import { Label } from '@/components/blog-generator/ui/label';
import { Input } from '@/components/blog-generator/ui/input';
import { Sliders } from 'lucide-react';

export default function ContentSettingsSection({
    formData,
    handleChange
}) {
    return (
        <Card className="bg-white rounded-xl shadow-sm border border-black/5">
            <CardHeader className="flex flex-row items-center space-x-3 pb-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <Sliders className="w-5 h-5" />
                </div>
                <div>
                    <CardTitle className="text-lg font-bold text-neutral-900">2. Content Settings</CardTitle>
                    <p className="text-xs text-neutral-500">Fine-tune the output style, size, and targeted reader.</p>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="length" className="text-sm font-semibold text-neutral-700 flex items-center gap-1 text-neutral-900">Blog Length</Label>
                        <select
                            id="length"
                            name="length"
                            className="flex h-10 w-full rounded-md w-full h-10 px-3 py-2 rounded-md border border-neutral-200 bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#8763e5]/50 focus:border-[#8763e5] transition-all px-3 py-2 text-sm ring-offset-background"
                            value={formData.length}
                            onChange={handleChange}
                        >
                            <option value="short">Short (~500 words)</option>
                            <option value="medium">Medium (~1000 words)</option>
                            <option value="long">Long (~2000+ words)</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tone" className="text-sm font-semibold text-neutral-700 flex items-center gap-1 text-neutral-900">Tone</Label>
                        <select
                            id="tone"
                            name="tone"
                            className="flex h-10 w-full rounded-md w-full h-10 px-3 py-2 rounded-md border border-neutral-200 bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#8763e5]/50 focus:border-[#8763e5] transition-all px-3 py-2 text-sm ring-offset-background"
                            value={formData.tone}
                            onChange={handleChange}
                        >
                            <option value="professional">Professional</option>
                            <option value="conversational">Conversational</option>
                            <option value="humorous">Humorous</option>
                            <option value="academic">Academic</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-1">
                        <Label htmlFor="audience" className="text-sm font-semibold text-neutral-700 flex items-center gap-1 text-neutral-900">Target Audience</Label>
                        <Input
                            id="audience"
                            name="audience"
                            placeholder="e.g. Beginners, Doctors"
                            value={formData.audience}
                            onChange={handleChange}
                            className="w-full"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
