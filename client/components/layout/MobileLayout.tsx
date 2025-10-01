"use client";

import { motion } from "framer-motion";
import { Home, ShoppingBag, Plus, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  {
    name: "Feed",
    href: "/",
    icon: Home,
  },
  {
    name: "Marketplace",
    href: "/marketplace",
    icon: ShoppingBag,
  },
  {
    name: "Create",
    href: "/create",
    icon: Plus,
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
  },
];

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Main content */}
      <main className="pb-20">{children}</main>

      {/* Bottom navigation */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50"
      >
        <div className="flex items-center justify-around py-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="relative"
                >
                  <Icon
                    size={24}
                    className={`transition-colors duration-200 ${
                      isActive ? "text-white" : "text-gray-400"
                    }`}
                  />
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.div>
                <span
                  className={`text-xs mt-1 transition-colors duration-200 ${
                    isActive ? "text-white" : "text-gray-400"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </motion.nav>
    </div>
  );
}