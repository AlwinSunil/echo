"use client";

import { signOut, useSession } from "next-auth/react";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

function ProfileMenu() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex items-center gap-2">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <img
              className="h-8 w-8 rounded-full border"
              src={
                session?.user?.image || "https://api.dicebear.com/9.x/glass/svg"
              }
              alt="Profile menu"
            />
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="flex w-64 flex-col gap-1.5 border bg-white px-2 py-2 text-sm backdrop:blur-lg"
              align="end"
            >
              <DropdownMenu.Label className="mt-1 flex flex-col px-2 font-medium">
                <span className="text-lg font-medium leading-5">
                  {session?.user?.name}
                </span>
                <span className="text-sm font-normal text-gray-500">
                  {session?.user?.email}
                </span>
              </DropdownMenu.Label>
              <DropdownMenu.Separator className="mx-1 h-px bg-gray-100" />
              <DropdownMenu.Item asChild>
                <button
                  className="w-full bg-red-500 px-3 py-1 font-medium text-white outline-none hover:bg-red-600"
                  onClick={() => signOut()}
                >
                  Sign out
                </button>
              </DropdownMenu.Item>
              <DropdownMenu.Arrow />
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    );
  }
}

export default ProfileMenu;
