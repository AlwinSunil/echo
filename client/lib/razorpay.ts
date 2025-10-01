import Razorpay from "razorpay";

// Initialize Razorpay (only in runtime, not during build)
export const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;

export interface PaymentOrder {
  id: string;
  amount: string | number;
  currency: string;
  receipt: string | undefined;
}

export interface PaymentOptions {
  amount: number; // Amount in paise (50 rupees = 5000 paise)
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
  method?: string; // Preferred payment method
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: string | number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  theme: {
    color: string;
  };
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  method?: string | string[];
  modal?: {
    ondismiss?: () => void;
  };
  retry?: {
    enabled: boolean;
    max_count: number;
  };
  callback_url?: string;
  reminder_enable?: boolean;
}

export class RazorpayPaymentService {
  async createOrder(options: PaymentOptions): Promise<PaymentOrder> {
    try {
      if (!razorpay) {
        throw new Error("Razorpay not initialized");
      }

      const orderOptions = {
        amount: options.amount,
        currency: options.currency || "INR",
        receipt: options.receipt,
        notes: options.notes || {},
        payment_capture: 1, // Auto capture payment
      };

      const order = await razorpay.orders.create(orderOptions);
      
      return {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      };
      
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      throw new Error("Failed to create payment order");
    }
  }

  async verifyPayment(paymentId: string, orderId: string): Promise<boolean> {
    try {
      if (!razorpay) {
        throw new Error("Razorpay not initialized");
      }

      const payment = await razorpay.payments.fetch(paymentId);
      
      // Verify payment details
      return (
        payment.order_id === orderId &&
        payment.status === "captured" &&
        payment.amount !== undefined
      );
      
    } catch (error) {
      console.error("Error verifying payment:", error);
      return false;
    }
  }

  async getPaymentDetails(paymentId: string) {
    try {
      if (!razorpay) {
        throw new Error("Razorpay not initialized");
      }

      const payment = await razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      console.error("Error fetching payment details:", error);
      throw new Error("Failed to fetch payment details");
    }
  }

  // Calculate platform fee and seller earnings
  calculateEarnings(totalAmount: number): {
    platformFee: number;
    sellerEarnings: number;
  } {
    // 40% platform fee, 60% to seller
    const platformFee = Math.round(totalAmount * 0.4);
    const sellerEarnings = totalAmount - platformFee;
    
    return {
      platformFee,
      sellerEarnings,
    };
  }

  // Format amount for display (paise to rupees)
  formatAmount(amountInPaise: number): string {
    return `₹${(amountInPaise / 100).toFixed(2)}`;
  }

  // Convert rupees to paise
  rupeesToPaise(rupees: number): number {
    return Math.round(rupees * 100);
  }

  // Validate UPI VPA (Virtual Payment Address)
  async validateVPA(vpa: string): Promise<{ valid: boolean; customer_name?: string }> {
    try {
      // Basic VPA format validation
      if (!vpa || !vpa.includes("@") || vpa.length < 5) {
        return { valid: false };
      }

      // For now, return true for valid format
      // In production, you can integrate with Razorpay's VPA validation API
      // or use a third-party UPI validation service
      return { 
        valid: true,
        customer_name: "Valid UPI ID"
      };
    } catch (error) {
      console.error("Error validating VPA:", error);
      return { valid: false };
    }
  }

  // Generate QR code for UPI payments
  async generateQRCode(options: {
    amount: number;
    currency?: string;
    description?: string;
    customer_id?: string;
  }): Promise<{ qr_code: string; short_url: string }> {
    try {
      // For now, generate a simple UPI QR code string
      // In production, you would integrate with Razorpay's QR API or use a QR generation library
      const upiId = "echo@paytm"; // Replace with your UPI ID
      const merchantName = "Echo";
      const amount = options.amount / 100; // Convert from paise to rupees
      
      // Generate UPI QR code string
      const qrString = `upi://pay?pa=${upiId}&pn=${merchantName}&am=${amount}&cu=INR&tn=${options.description || 'Echo Payment'}`;
      
      return {
        qr_code: qrString,
        short_url: qrString,
      };
    } catch (error) {
      console.error("Error generating QR code:", error);
      throw new Error("Failed to generate QR code");
    }
  }

  // Detect if device is mobile
  isMobileDevice(): boolean {
    if (typeof window === "undefined") return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  // Get optimal payment methods based on device
  getOptimalPaymentMethods(): string[] {
    if (this.isMobileDevice()) {
      // Mobile: Prioritize UPI Intent, then UPI Collect
      return ["upi", "netbanking", "wallet", "card"];
    } else {
      // Desktop: Prioritize UPI Collect, then other methods
      return ["upi", "netbanking", "card", "wallet"];
    }
  }

  // Enhanced signature verification for webhooks
  verifyWebhookSignature(
    body: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      const crypto = require("crypto");
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expectedSignature, "hex")
      );
    } catch (error) {
      console.error("Error verifying webhook signature:", error);
      return false;
    }
  }
}

// Export singleton instance
export const razorpayService = new RazorpayPaymentService();