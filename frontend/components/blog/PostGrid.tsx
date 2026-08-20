import React from "react";
import PostCard, { Post } from "./PostCard";

const MOCK_POSTS: Post[] = [
  // PRODUCT POSTS (The 6 Agents)
  {
    id: "cato-researcher",
    title: "Cato — The Researcher",
    date: "May 14, 2024",
    category: "Product",
    description: "Data acquisition & audience mapping. Cato autonomously scans global trends and competitive landscapes to establish the foundation of your campaign.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuD-P1a7MU-9Mc_9a_6AvCf2pkMg6MYxJXx3Tbc2mef3m96bt7hwozhL0dzzBEr3nY5e3D-fSQErsPXswyDq1blscffw8xEJKdDSgbVGuj0yC76YW_PJEuVXxGk0Obt3rGUdW8E929CMV90wAgl3MyI7Y3h6fjDlQesBE_sogeGXyVixwzj0RH4_HvGYHppLcnYwEw8iWfjIH5Fe6s4gVlxO_gj4i8Y5pR7uZNsMxI3BPaOgmhQkmSg"
  },
  {
    id: "vela-strategist",
    title: "Vela — The Strategist",
    date: "May 13, 2024",
    category: "Product",
    description: "Campaign strategy & angle selection. Processing raw data into structured, high-impact campaign blueprints optimized for conversion.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBqNV6H_Hq5UTtwn7CePbMycxKTxCFcSoarCbgmfwUxXfozded2iA9J0YhECakZHWmuU8rlcFtH5MAHvMmAjAY99P6WwfakG6514CWxuO6YMezodvJoNnunV0HodBYIDxL4ZkiBPuIhPgJNRjr66O65VmC0tDejiqV-Mdp_jWXURmzuyQGejAP5Ky02aGr1YbU5xFwfi6Ej7LnY74UZZj7LrzF43csyj8lRzbCbZA7yoAGIyirIHUk"
  },
  {
    id: "orin-copywriter",
    title: "Orin — The Copywriter",
    date: "May 12, 2024",
    category: "Product",
    description: "Scripting, copy & captions. Orin translates strategic blueprints into compelling narratives, generating everything from long-form scripts to micro-copy.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAlGqG5NXbmxeBZ6eAz46buoffV_htm4ZjubtoXeMv5zRir3PSzEepo5T0x03lQsR1hQwVMfqhn4EyKIttropN2Ood4Ob25fU-xr4pwByKWLteZBsuT33CpKbGd2NgXvitBCpcGCHjvTxo8ihBJWvpF66oK9S2N8dZKhM3rrsVxkM8hEaK2JYuhhKP9ylJBps9_HydIVRfbfriO9RAhZEYEQbh3_ujpQjUHvgbB7W79TtnDIoF3zlM"
  },
  {
    id: "iris-art-director",
    title: "Iris — The Art Director",
    date: "May 11, 2024",
    category: "Product",
    description: "Visual system & image generation. Translating narrative scripts into high-fidelity image prompts and generating the core visual assets.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAiPAxVq77kbNZMlsY51W1Dt_MWEoQt7k5baB7uAuBkuOqwp9koxVKczZCXICcfK0AtDYb7YMZwbMq1zN9xdujgbRGvzdlfo8Y_zYVFGWtVTmqyf4Qvo5W9xhKZUWYAKTQXZRqtppIvS7i90kAKFty180JzVummwmdeVqW3QP863QBPLs2CCm2bdYzUPcu_T9C-OIWNrv7gG2zXhQnmKNBA2eNrN6cDuO0SblLf-KAgqhfVI2CIaRg"
  },
  {
    id: "kade-video-producer",
    title: "Kade — The Video Producer",
    date: "May 10, 2024",
    category: "Product",
    description: "Motion & assembly. Kade ingests audio scripts and static keyframes, applying motion interpolation and timeline assembly to output broadcast-ready video.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuD-P1a7MU-9Mc_9a_6AvCf2pkMg6MYxJXx3Tbc2mef3m96bt7hwozhL0dzzBEr3nY5e3D-fSQErsPXswyDq1blscffw8xEJKdDSgbVGuj0yC76YW_PJEuVXxGk0Obt3rGUdW8E929CMV90wAgl3MyI7Y3h6fjDlQesBE_sogeGXyVixwzj0RH4_HvGYHppLcnYwEw8iWfjIH5Fe6s4gVlxO_gj4i8Y5pR7uZNsMxI3BPaOgmhQkmSg"
  },
  {
    id: "nova-distributor",
    title: "Nova — The Distributor",
    date: "May 09, 2024",
    category: "Product",
    description: "Scheduling & rollout. The final node in the pipeline. Nova handles multi-platform API distribution, calculating optimal posting windows based on global telemetry.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAlGqG5NXbmxeBZ6eAz46buoffV_htm4ZjubtoXeMv5zRir3PSzEepo5T0x03lQsR1hQwVMfqhn4EyKIttropN2Ood4Ob25fU-xr4pwByKWLteZBsuT33CpKbGd2NgXvitBCpcGCHjvTxo8ihBJWvpF66oK9S2N8dZKhM3rrsVxkM8hEaK2JYuhhKP9ylJBps9_HydIVRfbfriO9RAhZEYEQbh3_ujpQjUHvgbB7W79TtnDIoF3zlM"
  },

  // ENGINEERING POSTS (From the screenshot)
  {
    id: "voice-engine",
    title: "Voice Engine: Copy that sounds like you",
    date: "April 28, 2024",
    category: "Engineering",
    description: "Feed ContentForge examples of your best writing and every campaign inherits your cadence, objections, proof points, and preferred calls to action.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAiPAxVq77kbNZMlsY51W1Dt_MWEoQt7k5baB7uAuBkuOqwp9koxVKczZCXICcfK0AtDYb7YMZwbMq1zN9xdujgbRGvzdlfo8Y_zYVFGWtVTmqyf4Qvo5W9xhKZUWYAKTQXZRqtppIvS7i90kAKFty180JzVummwmdeVqW3QP863QBPLs2CCm2bdYzUPcu_T9C-OIWNrv7gG2zXhQnmKNBA2eNrN6cDuO0SblLf-KAgqhfVI2CIaRg"
  },
  {
    id: "visual-system",
    title: "Visual System: Campaign art with a memory",
    date: "April 25, 2024",
    category: "Engineering",
    description: "Thumbnails, carousels, hero graphics, and social visuals stay inside your palette, type system, and composition rules across every channel.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBqNV6H_Hq5UTtwn7CePbMycxKTxCFcSoarCbgmfwUxXfozded2iA9J0YhECakZHWmuU8rlcFtH5MAHvMmAjAY99P6WwfakG6514CWxuO6YMezodvJoNnunV0HodBYIDxL4ZkiBPuIhPgJNRjr66O65VmC0tDejiqV-Mdp_jWXURmzuyQGejAP5Ky02aGr1YbU5xFwfi6Ej7LnY74UZZj7LrzF43csyj8lRzbCbZA7yoAGIyirIHUk"
  },
  {
    id: "motion-desk",
    title: "Motion Desk: Short-form video without the drag",
    date: "April 22, 2024",
    category: "Engineering",
    description: "Storyboards, hooks, scene beats, captions, and export ratios are prepared together so reels and shorts feel native, not repurposed.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuD-P1a7MU-9Mc_9a_6AvCf2pkMg6MYxJXx3Tbc2mef3m96bt7hwozhL0dzzBEr3nY5e3D-fSQErsPXswyDq1blscffw8xEJKdDSgbVGuj0yC76YW_PJEuVXxGk0Obt3rGUdW8E929CMV90wAgl3MyI7Y3h6fjDlQesBE_sogeGXyVixwzj0RH4_HvGYHppLcnYwEw8iWfjIH5Fe6s4gVlxO_gj4i8Y5pR7uZNsMxI3BPaOgmhQkmSg"
  },
  {
    id: "distribution",
    title: "Distribution: Publish natively where your audience lives",
    date: "April 18, 2024",
    category: "Engineering",
    description: "X, LinkedIn, Instagram, TikTok, YouTube, newsletters, blogs, and webhooks get channel-specific assets from one approved campaign board.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAlGqG5NXbmxeBZ6eAz46buoffV_htm4ZjubtoXeMv5zRir3PSzEepo5T0x03lQsR1hQwVMfqhn4EyKIttropN2Ood4Ob25fU-xr4pwByKWLteZBsuT33CpKbGd2NgXvitBCpcGCHjvTxo8ihBJWvpF66oK9S2N8dZKhM3rrsVxkM8hEaK2JYuhhKP9ylJBps9_HydIVRfbfriO9RAhZEYEQbh3_ujpQjUHvgbB7W79TtnDIoF3zlM"
  },
  {
    id: "orchestration",
    title: "Orchestration: Agents critique before you ever review",
    date: "April 15, 2024",
    category: "Engineering",
    description: "Research, strategy, copy, art, video, and publishing agents work in parallel, challenge weak angles, and converge on a stronger launch plan.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAiPAxVq77kbNZMlsY51W1Dt_MWEoQt7k5baB7uAuBkuOqwp9koxVKczZCXICcfK0AtDYb7YMZwbMq1zN9xdujgbRGvzdlfo8Y_zYVFGWtVTmqyf4Qvo5W9xhKZUWYAKTQXZRqtppIvS7i90kAKFty180JzVummwmdeVqW3QP863QBPLs2CCm2bdYzUPcu_T9C-OIWNrv7gG2zXhQnmKNBA2eNrN6cDuO0SblLf-KAgqhfVI2CIaRg"
  },
  {
    id: "learning-loop",
    title: "Learning Loop: Every campaign updates the playbook",
    date: "April 10, 2024",
    category: "Engineering",
    description: "Performance data feeds the next brief, turning hooks, formats, and publishing windows into a compounding advantage.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBqNV6H_Hq5UTtwn7CePbMycxKTxCFcSoarCbgmfwUxXfozded2iA9J0YhECakZHWmuU8rlcFtH5MAHvMmAjAY99P6WwfakG6514CWxuO6YMezodvJoNnunV0HodBYIDxL4ZkiBPuIhPgJNRjr66O65VmC0tDejiqV-Mdp_jWXURmzuyQGejAP5Ky02aGr1YbU5xFwfi6Ej7LnY74UZZj7LrzF43csyj8lRzbCbZA7yoAGIyirIHUk"
  }
];

export default function PostGrid({ activeTab }: { activeTab: string }) {
  const filteredPosts = activeTab === "All" 
    ? MOCK_POSTS 
    : MOCK_POSTS.filter(post => post.category === activeTab);

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
