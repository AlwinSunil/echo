"use client";

import { motion } from "framer-motion";
import { Settings, Wallet, Package, TrendingUp, Users, Heart, Share2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import EnhancedPaymentModal from "@/components/EnhancedPaymentModal";

interface UserStats {
  totalImages: number;
  totalPrompts: number;
  totalSales: number;
  totalEarnings: number;
  totalLikes: number;
  followers: number;
  following: number;
}

interface UserCredits {
  marketplaceCredits: number;
  marketplaceCreditsUsed: number;
  customPromptsUsed: number;
}

// Mock user data
const userStats: UserStats = {
  totalImages: 127,
  totalPrompts: 23,
  totalSales: 45,
  totalEarnings: 2250,
  totalLikes: 3421,
  followers: 892,
  following: 156,
};

const userCredits: UserCredits = {
  marketplaceCredits: 8,
  marketplaceCreditsUsed: 3,
  customPromptsUsed: 24,
};

export default function Profile() {
  const [activeTab, setActiveTab] = useState("images");
  const [showCreditModal, setShowCreditModal] = useState(false);

  const tabs = [
    { id: "images", label: "Images", icon: "🖼️" },
    { id: "prompts", label: "Prompts", icon: "✨" },
    { id: "subscription", label: "Subscription", icon: "👑" },
    { id: "earnings", label: "Earnings", icon: "💰" },
  ];

  // Mock data for user's content
  const userImages = Array.from({ length: 12 }, (_, i) => ({
    id: i.toString(),
    url: "/api/placeholder/300/400",
    likes: Math.floor(Math.random() * 1000) + 50,
    prompt: "Sample generated image prompt",
  }));

  const userPrompts = [
    {
      id: "1",
      title: "Portrait Master",
      category: "Portrait",
      price: 50,
      sales: 23,
      earnings: 1150,
      isPublic: true,
    },
    {
      id: "2",
      title: "Fantasy Landscapes",
      category: "Fantasy",
      price: 50,
      sales: 18,
      earnings: 900,
      isPublic: true,
    },
    {
      id: "3",
      title: "Cyberpunk City",
      category: "Sci-Fi",
      price: 50,
      sales: 4,
      earnings: 200,
      isPublic: false,
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-gray-800"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-white">Profile</h1>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="text-white"
          >
            <Settings size={24} />
          </motion.button>
        </div>
      </motion.header>

      <div className="px-4 py-4">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-gray-700 overflow-hidden">
              <Image
                src="/api/placeholder/80/80"
                alt="Profile"
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-white font-bold text-lg">Creative Artist</h2>
              <p className="text-gray-400 text-sm">@creative_artist</p>
              <p className="text-gray-300 text-sm mt-1">
                AI Artist creating magical digital worlds ✨
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-white font-bold text-lg">{userStats.totalImages}</p>
              <p className="text-gray-400 text-xs">Images</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg">{userStats.followers}</p>
              <p className="text-gray-400 text-xs">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg">{userStats.following}</p>
              <p className="text-gray-400 text-xs">Following</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex-1 py-2 bg-gray-800 text-white rounded-lg font-semibold text-sm"
            >
              Edit Profile
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex-1 py-2 bg-white text-black rounded-lg font-semibold text-sm"
            >
              Share Profile
            </motion.button>
          </div>
        </motion.div>

        {/* Earnings Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 p-4 bg-gray-900 rounded-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Wallet size={20} className="text-green-400" />
              Earnings
            </h3>
            <span className="text-green-400 font-bold">₹{userStats.totalEarnings}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-white font-semibold">{userStats.totalSales}</p>
              <p className="text-gray-400 text-xs">Total Sales</p>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold">{userStats.totalPrompts}</p>
              <p className="text-gray-400 text-xs">Prompts Sold</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-gray-900 p-1 rounded-lg">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-white text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.icon} {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "images" && (
          <motion.div
            key="images"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-3 gap-2"
          >
            {userImages.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative aspect-square rounded-lg overflow-hidden"
              >
                <Image
                  src={image.url}
                  alt="User image"
                  width={150}
                  height={150}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 left-1 flex items-center gap-1">
                  <Heart size={12} className="text-white fill-white" />
                  <span className="text-white text-xs">{image.likes}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === "prompts" && (
          <motion.div
            key="prompts"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-3"
          >
            {userPrompts.map((prompt, index) => (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-gray-900 rounded-xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-white font-semibold">{prompt.title}</h4>
                    <p className="text-gray-400 text-sm">{prompt.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-semibold">₹{prompt.price}</p>
                    <p className="text-gray-400 text-xs">{prompt.sales} sales</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-xs">
                      Earnings: ₹{prompt.earnings}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      prompt.isPublic 
                        ? "bg-green-900 text-green-400" 
                        : "bg-gray-700 text-gray-400"
                    }`}>
                      {prompt.isPublic ? "Public" : "Draft"}
                    </span>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="text-gray-400 hover:text-white"
                  >
                    <Settings size={16} />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === "subscription" && (
          <motion.div
            key="subscription"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Credits Overview */}
            <div className="p-4 bg-gray-900 rounded-xl">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Package size={20} className="text-blue-400" />
                Usage Overview
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Marketplace Credits</p>
                    <p className="text-gray-400 text-sm">Used for paid prompts</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">
                      {userCredits.marketplaceCredits - userCredits.marketplaceCreditsUsed} / {userCredits.marketplaceCredits}
                    </p>
                    <p className="text-gray-400 text-xs">remaining</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Custom Prompts</p>
                    <p className="text-gray-400 text-sm">Your own prompts (unlimited)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{userCredits.customPromptsUsed}</p>
                    <p className="text-gray-400 text-xs">used</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Benefits */}
            <div className="p-4 bg-gray-900 rounded-xl">
              <h3 className="text-white font-semibold mb-4">Subscription Benefits</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Unlimited Custom Prompts</p>
                    <p className="text-gray-400 text-sm">Create images with your own prompts for free</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">5</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">5 Free Marketplace Credits</p>
                    <p className="text-gray-400 text-sm">Use paid prompts from other creators</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">₹</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Earn from Your Prompts</p>
                    <p className="text-gray-400 text-sm">Get ₹6 for each use of your marketplace prompts</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Buy More Credits */}
            <div className="p-4 bg-gray-900 rounded-xl">
              <h3 className="text-white font-semibold mb-4">Need More Credits?</h3>
              <p className="text-gray-400 text-sm mb-4">
                Purchase additional marketplace credits to use more paid prompts
              </p>
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreditModal(true)}
                className="w-full py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Buy 5 Credits for ₹50
              </motion.button>
            </div>
          </motion.div>
        )}

        {activeTab === "earnings" && (
          <motion.div
            key="earnings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Earnings Chart Placeholder */}
            <div className="p-6 bg-gray-900 rounded-xl text-center">
              <TrendingUp size={48} className="text-green-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">Earnings Trend</h3>
              <p className="text-gray-400 text-sm">Chart visualization coming soon</p>
            </div>

            {/* Recent Transactions */}
            <div>
              <h3 className="text-white font-semibold mb-3">Recent Sales</h3>
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                    <div>
                      <p className="text-white text-sm">Portrait Master Prompt</p>
                      <p className="text-gray-400 text-xs">2 hours ago</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-semibold">₹30</p>
                      <p className="text-gray-400 text-xs">60% cut</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Enhanced Credit Purchase Modal */}
      <EnhancedPaymentModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        credits={{
          count: 5,
          price: 50,
        }}
        onSuccess={() => {
          // Refresh user credits (in real app, you'd refetch from API)
          console.log("Credits purchased successfully");
        }}
      />
    </div>
  );
}