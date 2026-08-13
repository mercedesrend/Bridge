import type { Metadata } from "next";
import "./globals.css";
import { ClerkProviderWrapper } from "@/components/clerk-provider-wrapper";
import { AppFrame } from "@/components/shell/AppFrame";

export const metadata: Metadata = {
  title: "Bridge — your healthcare advocate",
  description:
    "Prepare, advocate, and take action for your health. Final eligibility for any clinical trial is determined by the trial site, not this tool.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/*
        suppressHydrationWarning: browser extensions (Grammarly, password
        managers) inject attributes like data-gr-ext-installed into <body>
        before React hydrates, which the server HTML can't know about. This
        only suppresses attribute mismatches on <body> itself — mismatches
        inside our own components still surface normally.
      */}
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <ClerkProviderWrapper>
          <AppFrame>{children}</AppFrame>
        </ClerkProviderWrapper>
      </body>
    </html>
  );
}
