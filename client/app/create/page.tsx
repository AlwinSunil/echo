"use client";

import { motion } from "framer-motion";
import { Send, Wand2, Download, Share2, RotateCcw, Sparkles, Search, Filter, ShoppingBag, Check, Crown, X } from "lucide-react";
// Replaced Next.js Image with native img
import { useState, useEffect } from "react";
import EnhancedPaymentModal from "@/components/EnhancedPaymentModal";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  createdAt: Date;
}

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
  isPurchased?: boolean;
  isOwned?: boolean;
}

interface UserCredits {
  marketplaceCredits: number;
  marketplaceCreditsUsed: number;
  customPromptsUsed: number;
}

export default function Create() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<MarketplacePrompt | null>(null);
  const [showPromptSelector, setShowPromptSelector] = useState(false);
  const [promptFilter, setPromptFilter] = useState<"all" | "free" | "purchased">("all");
  const [userCredits, setUserCredits] = useState<UserCredits>({
    marketplaceCredits: 5,
    marketplaceCreditsUsed: 0,
    customPromptsUsed: 0,
  });
  const [showCreditModal, setShowCreditModal] = useState(false);

  // Mock quick prompt suggestions
  const quickPrompts = [
    "A serene mountain landscape at sunset",
    "Portrait of a wise old wizard",
    "Futuristic city with flying cars",
    "Abstract geometric art in neon colors",
    "Cute robot in a garden",
    "Mystical forest with glowing mushrooms",
  ];

  // Mock marketplace prompts data
  const marketplacePrompts: MarketplacePrompt[] = [
    {
      id: "1",
      title: "Portrait Master",
      description: "Create stunning professional portraits with perfect lighting and composition",
      category: "Portrait",
      price: 0, // Free prompt
      sellerName: "Portrait Pro",
      sellerImage: "/api/placeholder/32/32",
      exampleImageUrl: "/api/placeholder/300/400",
      sales: 127,
      rating: 4.9,
      tags: ["portrait", "professional", "lighting"],
      isPurchased: true,
    },
    {
      id: "2",
      title: "Fantasy Landscapes",
      description: "Magical fantasy worlds with castles, dragons, and mystical creatures",
      category: "Fantasy",
      price: 10,
      sellerName: "Fantasy Artist",
      sellerImage: "/api/placeholder/32/32",
      exampleImageUrl: "/api/placeholder/300/400",
      sales: 89,
      rating: 4.8,
      tags: ["fantasy", "landscape", "magic"],
      isPurchased: true,
    },
    {
      id: "3",
      title: "Cyberpunk City",
      description: "Futuristic neon-lit cities with flying cars and cyberpunk aesthetics",
      category: "Sci-Fi",
      price: 10,
      sellerName: "Cyber Creator",
      sellerImage: "/api/placeholder/32/32",
      exampleImageUrl: "/api/placeholder/300/400",
      sales: 156,
      rating: 4.9,
      tags: ["cyberpunk", "futuristic", "neon"],
      isPurchased: false,
    },
  ];

  const filteredPrompts = marketplacePrompts.filter(prompt => {
    if (promptFilter === "free") return prompt.price === 0;
    if (promptFilter === "purchased") return prompt.isPurchased;
    return true;
  });

  const handleGenerate = async () => {
    if (!prompt.trim() && !selectedPrompt) return;

    // Check if using marketplace prompt and has credits
    if (selectedPrompt && selectedPrompt.price > 0 && !selectedPrompt.isPurchased) {
      const remainingCredits = userCredits.marketplaceCredits - userCredits.marketplaceCreditsUsed;
      if (remainingCredits <= 0) {
        alert("You need to purchase marketplace credits to use paid prompts!");
        return;
      }
    }

    setIsGenerating(true);
    
    try {
      const promptToUse = selectedPrompt ? selectedPrompt.description : prompt;
      
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: promptToUse,
          count: 1,
          promptId: selectedPrompt?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      const data = await response.json();
      
      if (data.success && data.images.length > 0) {
        const newImage: GeneratedImage = {
          id: data.images[0].id,
          url: data.images[0].imageUrl,
          prompt: promptToUse,
          createdAt: new Date(),
        };
        
        setGeneratedImages(prev => [newImage, ...prev]);
        setCurrentImage(newImage);

        // Update credits if using marketplace prompt
        if (selectedPrompt && selectedPrompt.price > 0 && !selectedPrompt.isPurchased) {
          setUserCredits(prev => ({
            ...prev,
            marketplaceCreditsUsed: prev.marketplaceCreditsUsed + 1,
          }));
        } else if (!selectedPrompt) {
          setUserCredits(prev => ({
            ...prev,
            customPromptsUsed: prev.customPromptsUsed + 1,
          }));
        }
      }
    } catch (error) {
      console.error("Error generating image:", error);
      // Fallback to mock data for demo
      const promptToUse = selectedPrompt ? selectedPrompt.description : prompt;
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: "/api/placeholder/400/600",
        prompt: promptToUse,
        createdAt: new Date(),
      };
      
      setGeneratedImages(prev => [newImage, ...prev]);
      setCurrentImage(newImage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickPrompt = (quickPrompt: string) => {
    setPrompt(quickPrompt);
    setSelectedPrompt(null); // Clear selected prompt when using quick prompt
  };

  const handleSelectPrompt = (prompt: MarketplacePrompt) => {
    setSelectedPrompt(prompt);
    setPrompt(""); // Clear custom prompt when selecting marketplace prompt
  };

  const handleClearSelection = () => {
    setSelectedPrompt(null);
  };

  const remainingCredits = userCredits.marketplaceCredits - userCredits.marketplaceCreditsUsed;

  const handleCreditsPurchased = (credits: number) => {
    setUserCredits(prev => ({
      ...prev,
      marketplaceCredits: prev.marketplaceCredits + credits,
    }));
  };

  const handleDownload = () => {
    if (!currentImage) return;
    // TODO: Implement download functionality
    console.log("Downloading image:", currentImage.id);
  };

  const handleShare = () => {
    if (!currentImage) return;
    // TODO: Implement share functionality
    console.log("Sharing image:", currentImage.id);
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
          <h1 className="text-xl font-bold text-white">Create</h1>
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="text-white"
            >
              <RotateCcw size={24} />
            </motion.button>
          </div>
        </div>
      </motion.header>

      <div className="px-4 py-4">
        {/* Credits Display */}
        <div className="mb-4 p-3 bg-gray-900 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown size={16} className="text-yellow-400" />
              <span className="text-white text-sm font-medium">Marketplace Credits</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm">
                {remainingCredits} / {userCredits.marketplaceCredits} remaining
              </span>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreditModal(true)}
                className="px-3 py-1 bg-white text-black text-xs font-semibold rounded-lg"
              >
                Buy Credits
              </motion.button>
            </div>
          </div>
        </div>

        {/* Prompt Selection Tabs */}
        <div className="mb-6">
          <div className="flex gap-1 mb-4 bg-gray-900 p-1 rounded-lg">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPromptSelector(false)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                !showPromptSelector
                  ? "bg-white text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              ✍️ Custom Prompt
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPromptSelector(true)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                showPromptSelector
                  ? "bg-white text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              🛒 Marketplace
            </motion.button>
          </div>

          {!showPromptSelector ? (
            <>
              {/* Quick Prompts */}
              <div className="mb-4">
                <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Sparkles size={20} className="text-yellow-400" />
                  Quick Prompts
                </h2>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                  {quickPrompts.map((quickPrompt, index) => (
                    <motion.button
                      key={index}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleQuickPrompt(quickPrompt)}
                      className="px-4 py-2 bg-gray-800 text-white text-sm rounded-full whitespace-nowrap hover:bg-gray-700 transition-colors"
                    >
                      {quickPrompt}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Custom Prompt Input */}
              <div className="mb-6">
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the image you want to create..."
                    className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 resize-none"
                    rows={4}
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleGenerate}
                    disabled={(!prompt.trim() && !selectedPrompt) || isGenerating}
                    className={`absolute bottom-3 right-3 p-2 rounded-lg transition-colors ${
                      (prompt.trim() || selectedPrompt) && !isGenerating
                        ? "bg-white text-black hover:bg-gray-100"
                        : "bg-gray-700 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isGenerating ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Wand2 size={20} />
                      </motion.div>
                    ) : (
                      <Send size={20} />
                    )}
                  </motion.button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Marketplace Prompts */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <ShoppingBag size={20} className="text-blue-400" />
                    Marketplace Prompts
                  </h2>
                  <div className="flex gap-1 bg-gray-800 p-1 rounded-lg">
                    {["all", "free", "purchased"].map((filter) => (
                      <motion.button
                        key={filter}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPromptFilter(filter as any)}
                        className={`px-3 py-1 text-xs rounded transition-colors ${
                          promptFilter === filter
                            ? "bg-white text-black"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        {filter === "all" ? "All" : filter === "free" ? "Free" : "Purchased"}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto hide-scrollbar">
                  {filteredPrompts.map((prompt) => (
                    <motion.div
                      key={prompt.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectPrompt(prompt)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedPrompt?.id === prompt.id
                          ? "border-white bg-gray-800"
                          : "border-gray-700 bg-gray-900 hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold text-sm">{prompt.title}</h3>
                          {prompt.isPurchased && (
                            <Check size={16} className="text-green-400" />
                          )}
                          {prompt.price === 0 && (
                            <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                              Free
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          {prompt.price > 0 ? (
                            <span className="text-white font-semibold text-sm">₹{prompt.price}</span>
                          ) : (
                            <span className="text-green-400 font-semibold text-sm">Free</span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-400 text-xs mb-2">{prompt.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">by {prompt.sellerName}</span>
                        <span className="text-gray-500 text-xs">•</span>
                        <span className="text-gray-500 text-xs">{prompt.sales} sales</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {selectedPrompt && (
                  <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold text-sm">{selectedPrompt.title}</p>
                        <p className="text-gray-400 text-xs">{selectedPrompt.description}</p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleClearSelection}
                        className="text-gray-400 hover:text-white"
                      >
                        <X size={16} />
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleGenerate}
                disabled={!selectedPrompt || isGenerating}
                className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                  selectedPrompt && !isGenerating
                    ? "bg-white text-black hover:bg-gray-100"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isGenerating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Wand2 size={20} />
                    </motion.div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Generate Image
                  </>
                )}
              </motion.button>
            </>
          )}
        </div>

        {/* Generated Image Display */}
        {currentImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <div className="relative bg-gray-900 rounded-xl overflow-hidden">
              <img
                src={currentImage.url}
                alt="Generated image"
                width={400}
                height={600}
                className="w-full aspect-[2/3] object-cover"
              />
              
              {/* Action Buttons Overlay */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDownload}
                  className="p-3 bg-black/50 backdrop-blur-md rounded-full"
                >
                  <Download size={20} className="text-white" />
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleShare}
                  className="p-3 bg-black/50 backdrop-blur-md rounded-full"
                >
                  <Share2 size={20} className="text-white" />
                </motion.button>
              </div>
            </div>

            {/* Generated Image Info */}
            <div className="mt-3 p-3 bg-gray-900 rounded-lg">
              <p className="text-gray-300 text-sm">{currentImage.prompt}</p>
            </div>
          </motion.div>
        )}

        {/* Generation Status */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-6 bg-gray-900 rounded-xl text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-gray-700 border-t-white rounded-full mx-auto mb-4"
            />
            <p className="text-white font-medium">Generating your image...</p>
            <p className="text-gray-400 text-sm mt-1">This may take a few moments</p>
          </motion.div>
        )}

        {/* Recent Generations */}
        {generatedImages.length > 0 && (
          <div>
            <h3 className="text-white font-semibold mb-3">Recent Creations</h3>
            <div className="grid grid-cols-3 gap-2">
              {generatedImages.slice(0, 6).map((image) => (
                <motion.div
                  key={image.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentImage(image)}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer ${
                    currentImage?.id === image.id ? "ring-2 ring-white" : ""
                  }`}
                >
                  <img
                    src={image.url}
                    alt="Generated image"
                    width={150}
                    height={150}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!currentImage && !isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wand2 size={32} className="text-gray-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Ready to Create?</h3>
            <p className="text-gray-400 text-sm">
              Enter a description or choose a quick prompt to generate your first image
            </p>
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
        onSuccess={(data) => {
          handleCreditsPurchased(data.credits);
        }}
      />
    </div>
  );
}