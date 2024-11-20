import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";

import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import Navbar from "@/app/components/navbar/Navbar";

import "./globals.css";

export const metadata: Metadata = {
  title: "Echo - Stream now",
  description: "Echo - Stream your activity to the world",
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
          <Navbar />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
