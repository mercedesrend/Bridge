import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth-shell";
import { CLERK_SIGN_UP_URL, hasClerkPublishableKey } from "@/lib/clerk";

export default function SignInPage() {
  if (!hasClerkPublishableKey()) {
    return (
      <AuthShell
        eyebrow="Clerk setup"
        title="Sign-in is ready once your keys are added."
        body="Add your Clerk publishable key and secret key to local and Vercel environments, then this route will render the hosted sign-in flow."
      >
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-[var(--muted)]">
              Next step
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
              Finish the auth connection for Bridge.
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              The product flow is already wired. Once the keys are present, this
              panel becomes the live Clerk sign-in experience.
            </p>
          </div>

          <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-raised)] p-4 text-sm leading-6 text-[var(--muted)]">
            Add <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
            <code>CLERK_SECRET_KEY</code> in local and Vercel envs.
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--brand)] px-5 text-sm font-semibold text-white"
            >
              Back to landing page
            </Link>
            <Link
              href="/home"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface-raised)] px-5 text-sm font-semibold text-[var(--foreground)]"
            >
              Continue to Bridge
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to pick up your visit plan where you left off."
      body="Keep your prep flow, visit notes, and follow-up recap together as you move through the care journey."
    >
      <SignIn signUpUrl={CLERK_SIGN_UP_URL} />
    </AuthShell>
  );
}
