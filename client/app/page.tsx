import { redirect } from "next/navigation";

import { Pacifico } from "@next/font/google";

import { auth } from "@/lib/auth";

import SignIn from "@/app/components/navbar/SignIn";

const pacifico = Pacifico({
  weight: "400",
  display: "swap",
});

export default async function Home() {
  const session = await auth();

  if (session?.user) redirect("/live");

  return (
    <div className="p-4 py-10">
      <div>
        <h1 className="text-7xl font-black">
          <span
            className={`font-pacifico animate-gradient bg-gradient-to-r from-violet-400 via-red-300 to-violet-400 bg-200% bg-clip-text text-8xl font-bold text-transparent ${pacifico.className}`}
          >
            echo
          </span>{" "}
          your activity
          <br /> to the world.
        </h1>
        <div className="mt-4 flex items-center gap-2">
          <SignIn />
        </div>
      </div>
    </div>
  );
}
