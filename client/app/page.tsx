"use client";

import { motion } from "framer-motion";
import { Heart, MessageCircle, Share, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface FeedPost {
  id: string;
  userId: string;
  userName: string;
  userImage: string;
  imageUrl: string;
  prompt: string;
  likes: number;
  comments: number;
  shares: number;
  createdAt: Date;
  isLiked: boolean;
}

// Mock data for now
const mockPosts: FeedPost[] = [
  {
    id: "1",
    userId: "user1",
    userName: "Creative Artist",
    userImage: "/api/placeholder/40/40",
    imageUrl: "/api/placeholder/400/600",
    prompt: "A stunning portrait of a woman with ethereal lighting, digital art style",
    likes: 1247,
    comments: 89,
    shares: 34,
    createdAt: new Date(),
    isLiked: false,
  },
  {
    id: "2",
    userId: "user2",
    userName: "AI Dreamer",
    userImage: "/api/placeholder/40/40",
    imageUrl: "/api/placeholder/400/600",
    prompt: "Futuristic cityscape with neon lights and flying cars",
    likes: 892,
    comments: 56,
    shares: 23,
    createdAt: new Date(),
    isLiked: true,
  },
];

export default function Home() {
  const [posts, setPosts] = useState<FeedPost[]>(mockPosts);

  const handleLike = (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-gray-800"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-white">Echo</h1>
          <div className="flex items-center gap-4">
            <button className="text-white">
              <MoreHorizontal size={24} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Feed */}
      <div className="pb-4">
        {posts.map((post, index) => (
          <motion.article
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="border-b border-gray-800 pb-4"
          >
            {/* Post Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                  <Image
                    src={post.userImage}
                    alt={post.userName}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{post.userName}</p>
                  <p className="text-gray-400 text-xs">2h ago</p>
                </div>
              </div>
              <button className="text-white">
                <MoreHorizontal size={20} />
              </button>
            </div>

            {/* Post Image */}
            <div className="relative">
              <Image
                src={post.imageUrl}
                alt="Generated image"
                width={400}
                height={600}
                className="w-full aspect-[2/3] object-cover"
              />
              
              {/* Action Buttons Overlay */}
              <div className="absolute right-4 bottom-4 flex flex-col gap-4">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleLike(post.id)}
                  className={`p-3 rounded-full backdrop-blur-md ${
                    post.isLiked ? "bg-red-500" : "bg-black/50"
                  }`}
                >
                  <Heart
                    size={24}
                    className={`${post.isLiked ? "fill-white text-white" : "text-white"}`}
                  />
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  className="p-3 rounded-full bg-black/50 backdrop-blur-md"
                >
                  <MessageCircle size={24} className="text-white" />
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  className="p-3 rounded-full bg-black/50 backdrop-blur-md"
                >
                  <Share size={24} className="text-white" />
                </motion.button>
              </div>
            </div>

            {/* Post Stats */}
            <div className="px-4 py-2">
              <p className="text-white font-semibold text-sm mb-1">
                {formatNumber(post.likes)} likes
              </p>
              
              {/* Prompt Preview */}
              <div className="mb-2">
                <span className="text-white font-semibold text-sm mr-2">
                  {post.userName}
                </span>
                <span className="text-gray-300 text-sm">
                  {post.prompt.length > 100 
                    ? `${post.prompt.substring(0, 100)}...` 
                    : post.prompt
                  }
                </span>
              </div>
              
              {post.comments > 0 && (
                <button className="text-gray-400 text-sm">
                  View all {post.comments} comments
                </button>
              )}
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
