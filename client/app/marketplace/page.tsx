"use client";

import { motion } from "framer-motion";
import { Search, Filter, ShoppingBag, Star, Eye, Crown, Zap } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import EnhancedPaymentModal from "@/components/EnhancedPaymentModal";

interface MarketplacePrompt {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  sellerName: string;
  sellerImage: string;
  exampleImageUrl: string;
  sales: number;
  rating: number;
  tags: string[];
}

// Mock data for marketplace
const mockPrompts: MarketplacePrompt[] = [
  {
    id: "1",
    title: "Portrait Master",
    description: "Create stunning professional portraits with perfect lighting and composition",
    category: "Portrait",
    price: 50,
    sellerName: "Portrait Pro",
    sellerImage: "/api/placeholder/32/32",
    exampleImageUrl: "/api/placeholder/300/400",
    sales: 127,
    rating: 4.9,
    tags: ["portrait", "professional", "lighting"],
  },
  {
    id: "2",
    title: "Fantasy Landscapes",
    description: "Magical fantasy worlds with castles, dragons, and mystical creatures",
    category: "Fantasy",
    price: 50,
    sellerName: "Fantasy Artist",
    sellerImage: "/api/placeholder/32/32",
    exampleImageUrl: "/api/placeholder/300/400",
    sales: 89,
    rating: 4.8,
    tags: ["fantasy", "landscape", "magic"],
  },
  {
    id: "3",
    title: "Cyberpunk City",
    description: "Futuristic neon-lit cities with flying cars and cyberpunk aesthetics",
    category: "Sci-Fi",
    price: 50,
    sellerName: "Cyber Creator",
    sellerImage: "/api/placeholder/32/32",
    exampleImageUrl: "/api/placeholder/300/400",
    sales: 156,
    rating: 4.9,
    tags: ["cyberpunk", "futuristic", "neon"],
  },
];

const categories = ["All", "Portrait", "Fantasy", "Sci-Fi", "Abstract", "Nature"];

export default function Marketplace() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<MarketplacePrompt | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [userCredits, setUserCredits] = useState({
    marketplaceCredits: 8,
    marketplaceCreditsUsed: 3,
    customPromptsUsed: 24,
  });
  const [showCreditModal, setShowCreditModal] = useState(false);

  const filteredPrompts = mockPrompts.filter(prompt => {
    const matchesCategory = selectedCategory === "All" || prompt.category === selectedCategory;
    const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         prompt.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handlePurchase = (prompt: MarketplacePrompt) => {
    setSelectedPrompt(prompt);
    setIsPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedPrompt(null);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-gray-800"
      >
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-white mb-4">Marketplace</h1>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {categories.map((category) => (
              <motion.button
                key={category}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? "bg-white text-black"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.header>

      {/* Credits Display */}
      <div className="px-4 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown size={16} className="text-yellow-400" />
            <span className="text-white text-sm font-medium">Your Credits</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-blue-400" />
              <span className="text-white font-semibold">
                {userCredits.marketplaceCredits - userCredits.marketplaceCreditsUsed}
              </span>
              <span className="text-gray-400 text-xs">
                / {userCredits.marketplaceCredits} remaining
              </span>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreditModal(true)}
              className="px-3 py-1 bg-white text-black text-xs font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Buy Credits
            </motion.button>
          </div>
        </div>
        <div className="mt-2">
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${((userCredits.marketplaceCredits - userCredits.marketplaceCreditsUsed) / userCredits.marketplaceCredits) * 100}%` 
              }}
            />
          </div>
          <p className="text-gray-400 text-xs mt-1">
            Each marketplace prompt costs 1 credit
          </p>
        </div>
      </div>

      {/* Prompts Grid */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          {filteredPrompts.map((prompt, index) => (
            <motion.div
              key={prompt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-900 rounded-xl overflow-hidden"
            >
              {/* Prompt Image */}
              <div className="relative aspect-[3/4]">
                <Image
                  src={prompt.exampleImageUrl}
                  alt={prompt.title}
                  width={300}
                  height={400}
                  className="w-full h-full object-cover"
                />
                
                {/* Category Badge */}
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 bg-black/70 text-white text-xs rounded-full">
                    {prompt.category}
                  </span>
                </div>

                {/* Credit Cost Badge */}
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                    <Zap size={10} />
                    1 Credit
                  </span>
                </div>
              </div>

              {/* Prompt Info */}
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gray-700 overflow-hidden">
                    <Image
                      src={prompt.sellerImage}
                      alt={prompt.sellerName}
                      width={24}
                      height={24}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-white text-xs font-medium">{prompt.sellerName}</span>
                </div>

                <h3 className="text-white font-semibold text-sm mb-1 line-clamp-1">
                  {prompt.title}
                </h3>
                
                <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                  {prompt.description}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-gray-400 text-xs">{prompt.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye size={12} className="text-gray-400" />
                    <span className="text-gray-400 text-xs">{prompt.sales} sales</span>
                  </div>
                </div>

                {/* Use Credit Button */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePurchase(prompt)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-white text-black rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
                >
                  <Zap size={16} className="text-blue-600" />
                  Use 1 Credit
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredPrompts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No prompts found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Floating Action Button for Selling */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-4 w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-lg z-50"
      >
        <ShoppingBag size={24} />
      </motion.button>

          {/* Enhanced Payment Modal */}
          {selectedPrompt && (
            <EnhancedPaymentModal
              isOpen={isPaymentModalOpen}
              onClose={handleClosePaymentModal}
              prompt={{
                id: selectedPrompt.id,
                title: selectedPrompt.title,
                price: selectedPrompt.price,
                sellerName: selectedPrompt.sellerName,
              }}
            />
          )}

          {/* Credit Purchase Modal */}
          <EnhancedPaymentModal
            isOpen={showCreditModal}
            onClose={() => setShowCreditModal(false)}
            credits={{
              count: 5,
              price: 50,
            }}
            onSuccess={(data) => {
              // Update user credits
              setUserCredits(prev => ({
                ...prev,
                marketplaceCredits: prev.marketplaceCredits + data.credits,
              }));
            }}
          />
        </div>
      );
    }