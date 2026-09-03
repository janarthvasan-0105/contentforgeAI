import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Navigation from './components/Navigation';

const Home = lazy(() => import('./pages/Home'));
const BlogGeneratorPage = lazy(() => import('./pages/BlogGeneratorPage'));
const BlogEditorPage = lazy(() => import('./pages/BlogEditorPage'));
const DraftsPage = lazy(() => import('./pages/DraftsPage'));
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage'));

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Navigation />
        <main className="flex-1">
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/generator" element={<BlogGeneratorPage />} />
              <Route path="/editor/:id" element={<BlogEditorPage />} />
              <Route path="/drafts" element={<DraftsPage />} />
              <Route path="/blog/:id" element={<BlogDetailPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </Router>
  );
}

export default App;
