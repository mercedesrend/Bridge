import Link from "next/link";
import { AskBridgeInlinePrompts } from "@/components/ask/AskBridgeInlinePrompts";
import { MatchesClient } from "@/components/MatchesClient";
import { decodeProfile } from "@/lib/profile";

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  const profile = decodeProfile(p);

  if (!profile || !profile.diagnosis) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm text-slate-600">
          We couldn&rsquo;t read a profile from this link.
        </p>
        <Link
          href="/profile"
          className="mt-3 inline-block rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white"
        >
          Start a profile
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link href="/profile" className="text-xs text-[var(--muted)] hover:text-slate-900">
          ← Edit profile
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Trials to consider
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {profile.diagnosis}
          {profile.stage ? ` · ${profile.stage}` : ""}
          {profile.age !== null ? ` · ${profile.age}` : ""}
          {profile.zip ? ` · near ${profile.zip}` : ""}
        </p>
      </div>

      <MatchesClient profile={profile} profileParam={p ?? ""} />
      <AskBridgeInlinePrompts
        title="Turn these results into questions"
        blurb="The trial list is most useful when it becomes a conversation with your care team. Ask Bridge to translate criteria, explain trade-offs, or help you prepare follow-up questions."
      />
    </div>
  );
}
