import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";

import MobileLayout from "@/components/layout/MobileLayout";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import "./globals.css";

export const metadata: Metadata = {
  title: "Echo - AI Image Generation",
  description: "Create stunning AI-generated images with Echo. Share your creations and discover amazing prompts in our marketplace.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">
        <SessionProvider>
          <MobileLayout>{children}</MobileLayout>
        </SessionProvider>
      </body>
    </html>
  );
}
