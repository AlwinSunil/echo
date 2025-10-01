"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Crown } from "lucide-react";
import { useEffect, useState } from "react";

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (credits: number) => void;
}

export default function CreditPurchaseModal({ isOpen, onClose, onSuccess }: CreditPurchaseModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handlePurchase = async () => {
    setIsProcessing(true);
    setPaymentStatus("processing");

    try {
      // Create credit purchase order
      const orderResponse = await fetch("/api/payment/purchase-credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creditsCount: 5,
        }),
      });

      if (!orderResponse.ok) {
        throw new Error("Failed to create credit purchase order");
      }

      const orderData = await orderResponse.json();

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Echo",
        description: "Purchase 5 Marketplace Credits",
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/payment/verify-credits", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                purchaseId: orderData.purchaseId,
              }),
            });

            if (verifyResponse.ok) {
              setPaymentStatus("success");
              onSuccess?.(5); // 5 credits added
              setTimeout(() => {
                onClose();
                setPaymentStatus("idle");
              }, 2000);
            } else {
              setPaymentStatus("error");
            }
          } catch (error) {
            console.error("Credit purchase verification error:", error);
            setPaymentStatus("error");
          }
        },
        theme: {
          color: "#000000",
        },
        prefill: {
          name: "Customer",
          email: "customer@example.com",
        },
        notes: {
          type: "marketplace_credits",
          credits: "5",
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error("Credit purchase error:", error);
      setPaymentStatus("error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-gray-900 rounded-xl p-6"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>

            {/* Content */}
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown size={32} className="text-white" />
              </div>
              
              <h3 className="text-white font-bold text-lg mb-2">Purchase Credits</h3>
              <p className="text-gray-400 text-sm mb-6">
                Get 5 marketplace credits for generating images with paid prompts
              </p>
              
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold">5 Marketplace Credits</span>
                  <span className="text-white font-bold text-xl">₹50</span>
                </div>
                <p className="text-gray-400 text-xs">
                  Each credit allows you to generate 1 image with a paid marketplace prompt
                </p>
              </div>

              {/* Payment Status */}
              {paymentStatus === "processing" && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Loader2 size={20} className="animate-spin text-white" />
                  <span className="text-white">Processing payment...</span>
                </div>
              )}

              {paymentStatus === "success" && (
                <div className="mb-4">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white text-xl">✓</span>
                  </div>
                  <p className="text-green-400 font-semibold">Credits Added!</p>
                  <p className="text-gray-400 text-sm">5 marketplace credits added to your account</p>
                </div>
              )}

              {paymentStatus === "error" && (
                <div className="mb-4">
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white text-xl">✗</span>
                  </div>
                  <p className="text-red-400 font-semibold">Purchase Failed</p>
                  <p className="text-gray-400 text-sm">Please try again</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={isProcessing || paymentStatus === "processing"}
                  className="flex-1 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing || paymentStatus === "processing" ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay ₹50`
                  )}
                </button>
              </div>

              {/* Payment Info */}
              <p className="text-gray-400 text-xs mt-4">
                Secure payment powered by Razorpay
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}