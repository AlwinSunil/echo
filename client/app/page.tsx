"use client";

import { motion } from "framer-motion";
import { Heart, MessageCircle, Share, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
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
    userImage: "https://via.placeholder.com/40",
    imageUrl: "https://via.placeholder.com/400x600?text=Generated+Image",
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
    userImage: "https://via.placeholder.com/40",
    imageUrl: "https://via.placeholder.com/400x600?text=Generated+Image",
    prompt: "Futuristic cityscape with neon lights and flying cars",
    likes: 892,
    comments: 56,
    shares: 23,
    createdAt: new Date(),
    isLiked: true,
  },
];

// Landing Page Component for Unauthenticated Users
function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        {/* Logo/Brand */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="text-6xl font-black text-white mb-4">Echo</h1>
          <p className="text-gray-400 text-lg">
            Create stunning AI-generated images with Echo
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 space-y-4"
        >
          <div className="p-4 bg-gray-900 rounded-xl border border-gray-800">
            <div className="text-3xl mb-2">✨</div>
            <h3 className="text-white font-semibold mb-1">AI Image Generation</h3>
            <p className="text-gray-400 text-sm">
              Create amazing images from text prompts
            </p>
          </div>

          <div className="p-4 bg-gray-900 rounded-xl border border-gray-800">
            <div className="text-3xl mb-2">🎨</div>
            <h3 className="text-white font-semibold mb-1">Marketplace</h3>
            <p className="text-gray-400 text-sm">
              Buy and sell creative prompts
            </p>
          </div>

          <div className="p-4 bg-gray-900 rounded-xl border border-gray-800">
            <div className="text-3xl mb-2">💰</div>
            <h3 className="text-white font-semibold mb-1">Earn Money</h3>
            <p className="text-gray-400 text-sm">
              Share your prompts and earn from each use
            </p>
          </div>
        </motion.div>

        {/* Google Sign In Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full py-4 bg-white text-black rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-3 shadow-lg"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-gray-500 text-sm"
        >
          By continuing, you agree to our Terms of Service and Privacy Policy
        </motion.p>
      </motion.div>
    </div>
  );
}

// Feed Component for Authenticated Users
function FeedPage() {
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
                    src="https://via.placeholder.com/40"
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
                src="https://via.placeholder.com/400x600?text=Generated+Image"
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

// Main Component that handles routing
export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Show loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // If authenticated, show the feed
  if (session) {
    return <FeedPage />;
  }

  // If not authenticated, show landing page
  return <LandingPage />;
}
