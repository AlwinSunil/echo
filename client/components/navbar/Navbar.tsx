import Link from "next/link";

import { auth } from "@/lib/auth";

import ProfileMenu from "./ProfileMenu";
import SignIn from "./SignIn";

export default async function Navbar() {
  const session = await auth();

  return (
    <nav className="flex items-center justify-between border-gray-100 bg-white px-4 py-2">
      <Link
        href={session ? "/live" : "/"}
        className="text-2xl font-black tracking-tight"
      >
        echo
      </Link>
      {session ? <ProfileMenu /> : <SignIn />}
    </nav>
  );
}
