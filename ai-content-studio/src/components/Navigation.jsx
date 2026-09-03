import { Link } from 'react-router-dom';
import { PenTool, Library } from 'lucide-react';

export default function Navigation() {
    return (
        <nav className="border-b bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex">
                        <Link to="/" className="flex items-center text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 inline-block text-transparent bg-clip-text">
                            <PenTool className="h-6 w-6 mr-2 text-blue-600" />
                            AI Content Studio
                        </Link>
                    </div>
                    <div className="flex space-x-4">
                        <Link to="/generator" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md font-medium flex items-center">
                            Generator
                        </Link>
                        <Link to="/drafts" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md font-medium flex items-center">
                            <Library className="h-4 w-4 mr-2" />
                            My Blogs
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
