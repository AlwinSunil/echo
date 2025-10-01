"use client";

import { motion } from "framer-motion";
import { Send, Wand2, Download, Share2, RotateCcw, Sparkles } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  createdAt: Date;
}

export default function Create() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);

  // Mock quick prompt suggestions
  const quickPrompts = [
    "A serene mountain landscape at sunset",
    "Portrait of a wise old wizard",
    "Futuristic city with flying cars",
    "Abstract geometric art in neon colors",
    "Cute robot in a garden",
    "Mystical forest with glowing mushrooms",
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
          count: 1,
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
          prompt: prompt,
          createdAt: new Date(),
        };
        
        setGeneratedImages(prev => [newImage, ...prev]);
        setCurrentImage(newImage);
      }
    } catch (error) {
      console.error("Error generating image:", error);
      // Fallback to mock data for demo
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: "/api/placeholder/400/600",
        prompt: prompt,
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
        {/* Quick Prompts */}
        <div className="mb-6">
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

        {/* Prompt Input */}
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
              disabled={!prompt.trim() || isGenerating}
              className={`absolute bottom-3 right-3 p-2 rounded-lg transition-colors ${
                prompt.trim() && !isGenerating
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

        {/* Generated Image Display */}
        {currentImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <div className="relative bg-gray-900 rounded-xl overflow-hidden">
              <Image
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
                  <Image
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
    </div>
  );
}