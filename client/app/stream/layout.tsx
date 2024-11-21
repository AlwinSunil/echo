import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export default async function StreamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) redirect("/");

  return <div className="flex px-4 py-4">{children}</div>;
}
