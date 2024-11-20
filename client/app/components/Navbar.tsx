"use client";

import { signIn } from "next-auth/react";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between bg-white p-4">
      <span>echo</span>
      <button onClick={() => signIn("google")}>Sign in with Google</button>
    </nav>
  );
}
