import Razorpay from "razorpay";

// Initialize Razorpay
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

export interface PaymentOptions {
  amount: number; // Amount in paise (50 rupees = 5000 paise)
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export class RazorpayPaymentService {
  async createOrder(options: PaymentOptions): Promise<PaymentOrder> {
    try {
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
}

// Export singleton instance
export const razorpayService = new RazorpayPaymentService();