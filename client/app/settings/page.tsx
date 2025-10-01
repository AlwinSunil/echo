"use client";

import { motion } from "framer-motion";
import { LogOut, Trash2, AlertTriangle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
      });

      if (response.ok) {
        // Sign out and redirect to home
        await signOut({ callbackUrl: "/" });
      } else {
        const error = await response.json();
        alert(error.message || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("An error occurred while deleting your account");
    } finally {
      setIsDeleting(false);
    }
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
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            className="text-white"
          >
            <ArrowLeft size={24} />
          </motion.button>
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <div className="w-6" /> {/* Spacer for alignment */}
        </div>
      </motion.header>

      <div className="px-4 py-6">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-4 p-4 bg-gray-900 rounded-xl">
            <div className="w-16 h-16 rounded-full bg-gray-700 overflow-hidden">
              <Image
                src={session?.user?.image || "https://placehold.co/80x80"}
                alt="Profile"
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-white font-bold text-lg">
                {session?.user?.name || "User"}
              </h2>
              <p className="text-gray-400 text-sm">
                {session?.user?.email || "user@example.com"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Account Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {/* Logout Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full p-4 bg-gray-900 hover:bg-gray-800 rounded-xl text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center">
                <LogOut size={20} className="text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold">Logout</h3>
                <p className="text-gray-400 text-sm">
                  Sign out of your account
                </p>
              </div>
            </div>
          </motion.button>

          {/* Delete Account Button with Alert Dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="w-full p-4 bg-gray-900 hover:bg-red-900/20 rounded-xl text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-900 rounded-full flex items-center justify-center">
                    <Trash2 size={20} className="text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">Delete Account</h3>
                    <p className="text-gray-400 text-sm">
                      Permanently delete your account
                    </p>
                  </div>
                </div>
              </motion.button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-gray-900 border-gray-800 text-white max-w-md mx-4">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-red-400">
                  <AlertTriangle size={24} />
                  Delete Account?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-300 space-y-3">
                  <p className="font-semibold">
                    This action cannot be undone!
                  </p>
                  <p>
                    Before deleting your account, please ensure you have:
                  </p>
                  <ul className="list-disc list-inside space-y-2 pl-2">
                    <li>Withdrawn any remaining money from your earnings</li>
                    <li>Used all your credits or transferred them</li>
                  </ul>
                  <p className="text-red-400 font-semibold">
                    Deleting your account will permanently remove all access to
                    the app, including:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2 text-red-300">
                    <li>All your generated images</li>
                    <li>Your prompts and marketplace listings</li>
                    <li>Your earnings history</li>
                    <li>All account data and statistics</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogCancel className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete My Account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>

        {/* Information Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 p-4 bg-gray-900 rounded-xl"
        >
          <h3 className="text-white font-semibold mb-3">About</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Version</span>
              <span className="text-white">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">App Name</span>
              <span className="text-white">Echo</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
