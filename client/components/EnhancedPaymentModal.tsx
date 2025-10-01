"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Smartphone, QrCode, CreditCard, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { razorpayService } from "@/lib/razorpay";

interface EnhancedPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt?: {
    id: string;
    title: string;
    price: number;
    sellerName: string;
  };
  credits?: {
    count: number;
    price: number;
  };
  onSuccess?: (data?: any) => void;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  recommended?: boolean;
}

export default function EnhancedPaymentModal({ 
  isOpen, 
  onClose, 
  prompt, 
  credits, 
  onSuccess 
}: EnhancedPaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [selectedMethod, setSelectedMethod] = useState<string>("auto");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [vpa, setVpa] = useState("");
  const [isValidatingVPA, setIsValidatingVPA] = useState(false);
  const [vpaValidation, setVpaValidation] = useState<{ valid: boolean; customer_name?: string } | null>(null);

  const isMobile = razorpayService.isMobileDevice();
  const isPromptPurchase = !!prompt;
  const amount = isPromptPurchase ? prompt.price : credits?.price || 0;

  const paymentMethods: PaymentMethod[] = [
    {
      id: "auto",
      name: "Recommended",
      icon: <CheckCircle size={20} className="text-green-400" />,
      description: isMobile ? "UPI Intent (Fastest)" : "UPI Collect (Desktop)",
      recommended: true,
    },
    {
      id: "upi",
      name: "UPI",
      icon: <Smartphone size={20} className="text-blue-400" />,
      description: isMobile ? "Open UPI app" : "Enter UPI ID",
    },
    {
      id: "qr",
      name: "QR Code",
      icon: <QrCode size={20} className="text-purple-400" />,
      description: "Scan with UPI app",
    },
    {
      id: "card",
      name: "Card/Net Banking",
      icon: <CreditCard size={20} className="text-orange-400" />,
      description: "Debit/Credit card",
    },
  ];

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

  const validateVPA = async (vpaInput: string) => {
    if (!vpaInput.includes("@")) return;
    
    setIsValidatingVPA(true);
    try {
      const response = await fetch("/api/validate-vpa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vpa: vpaInput }),
      });
      
      const result = await response.json();
      setVpaValidation(result);
    } catch (error) {
      console.error("VPA validation error:", error);
      setVpaValidation({ valid: false });
    } finally {
      setIsValidatingVPA(false);
    }
  };

  const generateQRCode = async () => {
    try {
      const response = await fetch("/api/generate-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          description: isPromptPurchase ? prompt.title : `${credits?.count} Credits`,
        }),
      });
      
      const data = await response.json();
      setQrCode(data.qr_code);
      setShowQR(true);
    } catch (error) {
      console.error("QR generation error:", error);
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    setPaymentStatus("processing");

    try {
      // Create payment order
      const orderResponse = await fetch(
        isPromptPurchase ? "/api/payment/create-order" : "/api/payment/purchase-credits",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(isPromptPurchase ? { promptId: prompt.id } : { creditsCount: credits?.count }),
            method: selectedMethod === "auto" ? undefined : selectedMethod,
          }),
        }
      );

      if (!orderResponse.ok) {
        throw new Error("Failed to create payment order");
      }

      const orderData = await orderResponse.json();

      // Configure Razorpay options based on selected method
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Echo",
        description: isPromptPurchase 
          ? `Purchase: ${prompt.title}` 
          : `Purchase ${credits?.count} Credits`,
        order_id: orderData.orderId,
        method: selectedMethod === "auto" ? razorpayService.getOptimalPaymentMethods() : [selectedMethod],
        prefill: {
          contact: "",
          email: "",
        },
        theme: {
          color: "#000000",
        },
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await fetch(
              isPromptPurchase ? "/api/payment/verify" : "/api/payment/verify-credits",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  purchaseId: orderData.purchaseId,
                }),
              }
            );

            if (verifyResponse.ok) {
              setPaymentStatus("success");
              onSuccess?.(isPromptPurchase ? prompt : { credits: credits?.count });
              setTimeout(() => {
                onClose();
                setPaymentStatus("idle");
              }, 2000);
            } else {
              setPaymentStatus("error");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            setPaymentStatus("error");
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setPaymentStatus("idle");
          },
        },
        retry: {
          enabled: true,
          max_count: 3,
        },
      };

      // Add UPI-specific options
      if (selectedMethod === "upi" && vpa && vpaValidation?.valid) {
        (options as any).upi = {
          flow: isMobile ? "intent" : "collect",
          vpa: vpa,
        };
      }

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error("Payment error:", error);
      setPaymentStatus("error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQRPayment = async () => {
    if (!qrCode) {
      await generateQRCode();
      return;
    }
    setShowQR(true);
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
            className="relative w-full max-w-md bg-gray-900 rounded-xl p-6 max-h-[90vh] overflow-y-auto"
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
              <h3 className="text-white font-bold text-lg mb-4">
                {isPromptPurchase ? "Purchase Prompt" : "Buy Credits"}
              </h3>
              
              {/* Payment Summary */}
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                {isPromptPurchase ? (
                  <>
                    <h4 className="text-white font-semibold mb-1">{prompt.title}</h4>
                    <p className="text-gray-400 text-sm mb-2">by {prompt.sellerName}</p>
                    <p className="text-white font-bold text-xl">₹{prompt.price}</p>
                  </>
                ) : (
                  <>
                    <h4 className="text-white font-semibold mb-1">{credits?.count} Marketplace Credits</h4>
                    <p className="text-gray-400 text-sm mb-2">Use for paid prompts</p>
                    <p className="text-white font-bold text-xl">₹{credits?.price}</p>
                  </>
                )}
              </div>

              {/* Payment Methods */}
              {!showQR && (
                <div className="mb-6">
                  <h4 className="text-white font-semibold mb-3 text-left">Choose Payment Method</h4>
                  <div className="space-y-2">
                    {paymentMethods.map((method) => (
                      <motion.button
                        key={method.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedMethod(method.id);
                          if (method.id === "qr") {
                            handleQRPayment();
                          }
                        }}
                        className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                          selectedMethod === method.id
                            ? "border-white bg-gray-800"
                            : "border-gray-700 bg-gray-900 hover:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {method.icon}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{method.name}</span>
                              {method.recommended && (
                                <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm">{method.description}</p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* UPI VPA Input */}
              {selectedMethod === "upi" && !isMobile && !showQR && (
                <div className="mb-4">
                  <label className="block text-white text-sm font-medium mb-2 text-left">
                    Enter UPI ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="example@paytm"
                      value={vpa}
                      onChange={(e) => {
                        setVpa(e.target.value);
                        if (e.target.value.includes("@")) {
                          validateVPA(e.target.value);
                        } else {
                          setVpaValidation(null);
                        }
                      }}
                      className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                    />
                    {isValidatingVPA && (
                      <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
                    )}
                    {vpaValidation && (
                      <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                        vpaValidation.valid ? "text-green-400" : "text-red-400"
                      }`}>
                        {vpaValidation.valid ? "✓" : "✗"}
                      </div>
                    )}
                  </div>
                  {vpaValidation?.valid && vpaValidation.customer_name && (
                    <p className="text-green-400 text-sm mt-1 text-left">
                      Valid UPI ID for {vpaValidation.customer_name}
                    </p>
                  )}
                  {vpaValidation?.valid === false && vpa && (
                    <p className="text-red-400 text-sm mt-1 text-left">
                      Invalid UPI ID
                    </p>
                  )}
                </div>
              )}

              {/* QR Code Display */}
              {showQR && qrCode && (
                <div className="mb-6">
                  <h4 className="text-white font-semibold mb-3">Scan QR Code</h4>
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <img 
                      src={`data:image/svg+xml;base64,${btoa(qrCode)}`} 
                      alt="Payment QR Code" 
                      className="w-48 h-48"
                    />
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    Scan with any UPI app to complete payment
                  </p>
                  <button
                    onClick={() => setShowQR(false)}
                    className="mt-2 text-gray-400 hover:text-white text-sm"
                  >
                    ← Back to payment methods
                  </button>
                </div>
              )}

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
                  <p className="text-green-400 font-semibold">Payment Successful!</p>
                  <p className="text-gray-400 text-sm">
                    {isPromptPurchase ? "You can now use this prompt" : "Credits added to your account"}
                  </p>
                </div>
              )}

              {paymentStatus === "error" && (
                <div className="mb-4">
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white text-xl">✗</span>
                  </div>
                  <p className="text-red-400 font-semibold">Payment Failed</p>
                  <p className="text-gray-400 text-sm">Please try again</p>
                </div>
              )}

              {/* Action Buttons */}
              {!showQR && (
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={
                      isProcessing || 
                      paymentStatus === "processing" ||
                      (selectedMethod === "upi" && !isMobile && (!vpa || !vpaValidation?.valid))
                    }
                    className="flex-1 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing || paymentStatus === "processing" ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Pay ₹${amount}`
                    )}
                  </button>
                </div>
              )}

              {/* Payment Info */}
              <p className="text-gray-400 text-xs mt-4">
                Secure payment powered by Razorpay • UPI optimized for India
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}