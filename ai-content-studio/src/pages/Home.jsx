import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-center px-4">
            <h1 className="text-5xl font-extrabold tracking-tight mb-6 mt-12 bg-gradient-to-r from-blue-600 to-purple-600 inline-block text-transparent bg-clip-text">
                AI Content Studio
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mb-10">
                An AI-powered blog generation and publishing platform that researches, writes, optimizes, edits, stores, and publishes SEO-friendly blogs using Groq-powered AI and Tavily research.
            </p>
            <Link to="/generator">
                <Button size="lg" className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105">
                    Generate Blog Now
                </Button>
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-5xl">
                <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-xl mb-2 text-blue-700">Deep Research</h3>
                    <p className="text-gray-600">Uses Tavily API to fetch real-time statistics, trends, and references.</p>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-xl mb-2 text-purple-700">SEO Optimized</h3>
                    <p className="text-gray-600">Generates keywords, search intent, and meta data to rank higher.</p>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-xl mb-2 text-green-700">Humanized Output</h3>
                    <p className="text-gray-600">Creates natural, human-like content edited for quality and readability.</p>
                </div>
            </div>
        </div>
    );
}
