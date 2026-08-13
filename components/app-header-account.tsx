"use client";

import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function AppHeaderAccount() {
  if (!clerkEnabled) {
    return (
      <Link
        href="/"
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-4 text-sm font-semibold"
      >
        Bridge home
      </Link>
    );
  }

  return <ClerkHeaderAccount />;
}

function ClerkHeaderAccount() {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return <div className="h-11 w-24 rounded-full border border-[color:var(--line)] bg-white/70" />;
  }

  if (!userId) {
    return (
      <Link
        href="/sign-in"
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-4 text-sm font-semibold"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center justify-end gap-3">
      <UserButton />
    </div>
  );
}
