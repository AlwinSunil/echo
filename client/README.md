# Echo - AI Image Generation App

Echo is a modern, mobile-first AI image generation application powered by Google Gemini. It features a clean, Instagram-like interface with a marketplace where users can buy and sell AI prompts.

## Features

- 🤖 **AI Image Generation**: Powered by Google Gemini 2.0 Flash
- 📱 **Mobile-First Design**: Clean, modern UI optimized for mobile devices
- 🛒 **Marketplace**: Buy and sell AI prompts with Razorpay UPI payments
- 💰 **Earnings System**: 60% revenue share for prompt creators
- 🔐 **Google Authentication**: Secure sign-in with NextAuth
- ⚡ **Real-time Updates**: Framer Motion animations for smooth UX
- 🎨 **Clean UI**: No shadows, flat design with subtle animations

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth with Google OAuth
- **AI**: Google Gemini 2.0 Flash
- **Payments**: Razorpay (India-specific UPI)
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google Cloud Console project (for Gemini API and OAuth)
- Razorpay account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd echo/client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/echo_db"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-nextauth-secret-key"
   
   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   # Google Gemini AI
   GOOGLE_GEMINI_API_KEY="your-gemini-api-key"
   
   # Razorpay
   RAZORPAY_KEY_ID="your-razorpay-key-id"
   RAZORPAY_KEY_SECRET="your-razorpay-key-secret"
   RAZORPAY_WEBHOOK_SECRET="your-razorpay-webhook-secret"
   NEXT_PUBLIC_RAZORPAY_KEY_ID="your-razorpay-key-id"
   ```

4. **Set up the database**
   ```bash
   # Generate database migrations
   npm run db:generate
   
   # Apply migrations
   npm run db:push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## API Setup

### Google Cloud Console

1. Create a new project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable the Gemini API
3. Create API credentials and get your API key
4. Set up OAuth 2.0 credentials for Google sign-in

### Razorpay Setup

1. Create a [Razorpay account](https://razorpay.com)
2. Get your API keys from the dashboard
3. Set up webhook endpoints for payment verification
4. Configure UPI payment methods for India

## Project Structure

```
client/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── generate-image/ # Image generation endpoint
│   │   └── payment/       # Payment handling
│   ├── create/            # Image creation page
│   ├── marketplace/       # Prompt marketplace
│   ├── profile/           # User profile
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── layout/           # Layout components
│   └── PaymentModal.tsx  # Payment modal
├── db/                   # Database schema
├── lib/                  # Utility libraries
│   ├── auth.ts          # NextAuth configuration
│   ├── gemini.ts        # Gemini AI integration
│   └── razorpay.ts      # Payment processing
└── public/              # Static assets
```

## Key Features

### Image Generation
- Clean, minimal interface for prompt input
- Quick prompt suggestions
- Real-time generation status
- Recent creations gallery

### Marketplace
- Browse prompts by category
- Search functionality
- One-click purchase with Razorpay
- Seller earnings tracking

### User Profile
- Personal image gallery
- Prompt management
- Earnings dashboard
- Sales analytics

### Payment System
- Razorpay UPI integration
- 60% revenue share for creators
- Secure payment processing
- Transaction history

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Environment Variables for Production

Make sure to set all environment variables in your deployment platform:
- Database connection string
- API keys for Google and Razorpay
- NextAuth configuration
- Webhook secrets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@echo-app.com or create an issue in the repository.