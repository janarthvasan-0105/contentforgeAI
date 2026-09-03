"use client";

import React, { useState, useEffect } from "react";
import Footer from "@/components/site/Footer";
import FeaturedPost from "@/components/blog/FeaturedPost";
import FilterTabs from "@/components/blog/FilterTabs";
import PostGrid from "@/components/blog/PostGrid";
import Link from "next/link";
import Logo from "@/components/site/Logo";
import { blogGenSupabase as supabase } from '@/lib/blog-generator/supabase-client';

export default function BlogPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        const mappedPosts = data.map(blog => {
          let imageUrl = '';
          let desc = '';
          try {
            const parsed = JSON.parse(blog.content);
            if (parsed.featuredImage?.url) imageUrl = parsed.featuredImage.url;
            if (parsed.metaDescription) desc = parsed.metaDescription;
            else if (parsed.sections?.[0]?.body) desc = parsed.sections[0].body.substring(0, 150) + '...';
          } catch (e) {
            // legacy markdown, strip html for description
            const stripped = blog.content.replace(/<[^>]+>/g, '');
            desc = stripped.substring(0, 150) + '...';
          }

          let cat = blog.category || "Uncategorized";
          if (blog.topic && blog.topic.includes("|||")) {
              cat = blog.topic.split("|||")[1];
          }

          // Strip emoji from category for display
          cat = cat.replace(/^[\p{Emoji}\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, '').trim();

          return {
            id: blog.id,
            title: blog.title || "Untitled",
            date: new Date(blog.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
            category: cat,
            description: desc,
            imageUrl
          };
        });
        // We can choose to only show published here, but for now we'll show all or if they have a 'published' status
        setPosts(mappedPosts.filter(p => true)); // Or filter by blog.status === 'published'
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="bg-[#fcfcfc] text-[#111827] min-h-screen relative font-sans">
      
      {/* Blog Navigation (Simplified version of main nav for blog) */}
      <header className="fixed top-0 w-full z-50 bg-[#fcfcfc]/90 backdrop-blur-xl border-b border-black/5 transition-all duration-300 ease-in-out">
        <div className="flex justify-between items-center h-20 px-8 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center hover:opacity-90 transition gap-2">
            <Logo className="text-[20px]" />
          </Link>
          <nav className="hidden md:flex items-center gap-8 font-medium text-[15px] text-black/70">
            <Link className="hover:text-black transition-colors" href="/#product">Product</Link>
            <Link className="hover:text-black transition-colors" href="/agents">Agents</Link>
            <Link className="hover:text-black transition-colors" href="/pricing">Pricing</Link>
            <Link className="text-[#0A5CFF] font-semibold" href="/blog">Blog</Link>
          </nav>
          <div className="flex items-center">
            <Link href="/signup" className="text-[14px] bg-black text-white px-5 py-2.5 rounded-full font-medium hover:bg-black/85 transition-colors">Get Started</Link>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
        <FeaturedPost />
        <FilterTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <PostGrid activeTab={activeTab} posts={posts} loading={loading} />
      </main>
      
      <Footer />
    </div>
  );
}
