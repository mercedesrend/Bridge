"use client";

import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";
import clsx from "clsx";
import { CLERK_SIGN_IN_URL, CLERK_SIGN_UP_URL } from "@/lib/clerk";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

type AuthCtaProps = {
  compact?: boolean;
};

export function AuthCta({ compact = false }: AuthCtaProps) {
  if (!clerkEnabled) {
    return (
      <div
        className={clsx(
          "flex flex-wrap items-center gap-3",
          compact && "justify-end",
        )}
      >
        <Link
          href="/home"
          className={clsx(
            "inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--brand)] px-5 text-sm font-semibold text-white",
            compact && "px-4",
          )}
        >
          Open Bridge
        </Link>
        <Link
          href="#how-it-works"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--foreground)]"
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
    return (
      <div
        className={clsx(
          "h-11 w-40 rounded-full border border-[var(--line)] bg-white/70",
          compact && "ml-auto",
        )}
      />
    );
  }

  if (userId) {
    return (
      <div
        className={clsx(
          "flex flex-wrap items-center gap-3",
          compact && "justify-end",
        )}
      >
        <Link
          href="/home"
          className={clsx(
            "inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--brand)] px-5 text-sm font-semibold text-white",
            compact && "px-4",
          )}
        >
          Open Bridge
        </Link>
        <UserButton />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "flex flex-wrap items-center gap-3",
        compact && "justify-end",
      )}
    >
      <Link
        href={CLERK_SIGN_UP_URL}
        className={clsx(
          "inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--brand)] px-5 text-sm font-semibold text-white",
          compact && "px-4",
        )}
      >
        Create account
      </Link>
      <Link
        href={CLERK_SIGN_IN_URL}
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--foreground)]"
      >
        Sign in
      </Link>
    </div>
  );
}
