import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface Post {
  id: string;
  title: string;
  date: string;
  category: string;
  description: string;
  imageUrl: string;
}

export default function PostCard({ post }: { post: Post }) {
  return (
    <div className="flex flex-col sm:flex-row gap-6 md:gap-8 py-8 border-b border-black/10 group">
      {/* Content */}
      <div className="flex-1 flex flex-col items-start">
        <div className="flex items-center text-[13px] font-medium text-neutral-500 gap-2 mb-3">
          <span>{post.date}</span>
          <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
          <span className="uppercase tracking-wider">{post.category}</span>
        </div>
        
        <h3 className="text-xl md:text-2xl font-bold text-neutral-900 leading-snug mb-3 group-hover:text-[#0A5CFF] transition-colors line-clamp-2">
          <Link href={`/blog/${post.id}`} className="focus:outline-none">
            {post.title}
          </Link>
        </h3>
        
        <p className="text-neutral-600 line-clamp-2 text-[15px] mb-4">
          {post.description}
        </p>

        <Link href={`/blog/${post.id}`} className="mt-auto inline-flex items-center text-[#0A5CFF] font-medium text-[14px] hover:underline">
          Read article
          <ArrowRight size={16} className="ml-1.5" />
        </Link>
      </div>

      {/* Image */}
      <Link href={`/blog/${post.id}`} className="shrink-0 order-first sm:order-last">
        <div className="w-full sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden bg-neutral-100 border border-black/5">
          {post.imageUrl ? (
            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 group-hover:scale-105 transition-transform duration-500" />
          )}
        </div>
      </Link>
    </div>
  );
}
