"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";
import clsx from "clsx";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

type AuthCtaProps = {
  compact?: boolean;
};

export function AuthCta({ compact = false }: AuthCtaProps) {
  if (!clerkEnabled) {
    return (
      <div className={clsx("flex flex-wrap items-center gap-3", compact && "justify-end")}>
        <Link
          href="/intake"
          className={clsx(
            "inline-flex min-h-11 items-center justify-center rounded-full bg-[color:var(--accent)] px-5 text-sm font-semibold text-white",
            compact && "px-4"
          )}
        >
          Start the demo
        </Link>
        <Link
          href="#how-it-works"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-5 text-sm font-semibold"
        >
          See how it works
        </Link>
      </div>
    );
  }

  return <ClerkAuthCta compact={compact} />;
}

function ClerkAuthCta({ compact = false }: AuthCtaProps) {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return <div className={clsx("h-11 w-40 rounded-full border border-[color:var(--line)] bg-white/70", compact && "ml-auto")} />;
  }

  if (userId) {
    return (
      <div className={clsx("flex flex-wrap items-center gap-3", compact && "justify-end")}>
        <Link
          href="/intake"
          className={clsx(
            "inline-flex min-h-11 items-center justify-center rounded-full bg-[color:var(--accent)] px-5 text-sm font-semibold text-white",
            compact && "px-4"
          )}
        >
          Open Bridge
        </Link>
        <UserButton />
      </div>
    );
  }

  return (
    <div className={clsx("flex flex-wrap items-center gap-3", compact && "justify-end")}>
      <SignUpButton mode="redirect">
        <button
          type="button"
          className={clsx(
            "inline-flex min-h-11 items-center justify-center rounded-full bg-[color:var(--accent)] px-5 text-sm font-semibold text-white",
            compact && "px-4"
          )}
        >
          Create account
        </button>
      </SignUpButton>
      <SignInButton mode="redirect">
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-5 text-sm font-semibold"
        >
          Sign in
        </button>
      </SignInButton>
    </div>
  );
}
