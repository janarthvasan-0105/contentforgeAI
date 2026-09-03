import React from "react";
import PostCard, { Post } from "./PostCard";

export default function PostGrid({ activeTab, posts, loading }: { activeTab: string, posts: Post[], loading: boolean }) {
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#0A5CFF]"></div>
      </div>
    );
  }

  const filteredPosts = activeTab === "All" 
    ? posts 
    : posts.filter(post => {
        // Simple case-insensitive matching logic, assuming category tags
        return post.category?.toLowerCase().includes(activeTab.toLowerCase());
      });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
      {filteredPosts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
      
      {filteredPosts.length === 0 && (
        <div className="col-span-1 md:col-span-2 py-12 text-center text-neutral-500">
          No posts found for this category.
        </div>
      )}
    </div>
  );
}
