import Link from 'next/link';
import { PenTool, Library } from 'lucide-react';

export default function Navigation() {
    return (
        <nav className="border-b bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex">
                        <Link href="/" className="flex items-center text-xl font-bold text-neutral-900 font-black">
                            <PenTool className="h-6 w-6 mr-2 text-[#8763e5]" />
                            AI Content Studio
                        </Link>
                    </div>
                    <div className="flex space-x-4">
                        <Link href="/generator" className="text-neutral-900 hover:text-[#8763e5] px-3 py-2 rounded-md font-medium flex items-center">
                            Generator
                        </Link>
                        <Link href="/drafts" className="text-neutral-900 hover:text-[#8763e5] px-3 py-2 rounded-md font-medium flex items-center">
                            <Library className="h-4 w-4 mr-2" />
                            My Blogs
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
