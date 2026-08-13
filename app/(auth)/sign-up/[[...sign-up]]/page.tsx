import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth-shell";
import { CLERK_SIGN_IN_URL, hasClerkPublishableKey } from "@/lib/clerk";

export default function SignUpPage() {
  if (!hasClerkPublishableKey()) {
    return (
      <AuthShell
        eyebrow="Clerk setup"
        title="Account creation turns on when Clerk is configured."
        body="Once your Clerk keys are present, this page will become a hosted sign-up flow for Bridge."
      >
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-[color:var(--muted)]">Next step</p>
            <h2 className="mt-2 text-2xl font-semibold">Finish the auth connection for Bridge.</h2>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
              The account flow is ready for you. Once the env vars are present, this card becomes the live sign-up screen.
            </p>
          </div>

          <div className="rounded-[24px] border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-4 text-sm leading-6 text-[color:var(--muted)]">
            Add <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and <code>CLERK_SECRET_KEY</code> in local and Vercel envs.
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[color:var(--accent)] px-5 text-sm font-semibold text-white"
            >
              Back to landing page
            </Link>
            <Link
              href="/intake"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface-raised)] px-5 text-sm font-semibold"
            >
              Continue to the demo
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Create your account"
      title="Make Bridge your ongoing appointment companion."
      body="Save your prep across devices, keep your visit flow gated to you, and make it easier to return for the next appointment."
    >
      <SignUp signInUrl={CLERK_SIGN_IN_URL} />
    </AuthShell>
  );
}
