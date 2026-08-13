import Link from "next/link";
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <p className="text-sm text-slate-600">
          We couldn&rsquo;t read a profile from this link.
        </p>
        <Link
          href="/"
          className="mt-3 inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white"
        >
          Start a profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <Link href="/" className="text-xs text-slate-500 hover:text-slate-900">
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
    </div>
  );
}
