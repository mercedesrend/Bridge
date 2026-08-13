"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { hasClerkPublishableKey } from "@/lib/clerk";

export function ClerkProviderWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!hasClerkPublishableKey()) {
    return children;
  }

  return <ClerkProvider>{children}</ClerkProvider>;
}
