import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { AppShell } from "@/components/app-shell";
import { CLERK_SIGN_IN_URL, isClerkConfigured } from "@/lib/clerk";

export default async function ExperienceLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (isClerkConfigured()) {
    const session = await auth();

    if (!session.userId) {
      const params = new URLSearchParams({
        redirect_url: "/intake"
      });
      redirect(`${CLERK_SIGN_IN_URL}?${params.toString()}`);
    }
  }

  return <AppShell>{children}</AppShell>;
}
