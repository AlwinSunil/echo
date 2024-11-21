"use client";

import { signIn } from "next-auth/react";

export default function SignIn() {
  return (
    <button
      className="bg-gradient-to-tr from-emerald-600 to-emerald-400 px-3 py-1 text-base font-medium text-white hover:to-emerald-500"
      onClick={() => signIn("google")}
    >
      Sign in with Google
    </button>
  );
}
