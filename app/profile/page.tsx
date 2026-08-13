import Link from "next/link";
import { AskBridgeInlinePrompts } from "@/components/ask/AskBridgeInlinePrompts";
import { IntakeForm } from "@/components/IntakeForm";
import { Icon } from "@/components/shell/Icon";

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--brand)]">
          <Icon name="flask" className="h-3.5 w-3.5" />
          Clinical Trials
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
          Find trials worth asking about
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Tell us about your situation. Bridge searches currently recruiting
          trials and compares your profile against each trial&rsquo;s
          eligibility criteria, one line at a time — so you can walk into your
          next appointment with a focused list of questions.
        </p>
      </section>

      <section className="card p-5 sm:p-6">
        <IntakeForm />
      </section>

      <section className="rounded-2xl bg-[var(--brand-soft)] p-4 text-[13px] leading-relaxed text-slate-600">
        <p className="font-semibold text-slate-800">A note on how to use this</p>
        <p className="mt-1">
          Bridge never tells you that you qualify for a trial. It highlights
          trials that may be{" "}
          <span className="font-semibold">
            worth asking your care team about
          </span>
          , and flags exactly what information a trial site would still need.
          Final eligibility is determined by the trial site, not this tool.
        </p>
      </section>

      <AskBridgeInlinePrompts
        title="Get help filling this out"
        blurb="This is a good place for plain-language questions about diagnosis wording, prior treatments, biomarkers, or what details are worth entering."
      />

      <p className="text-xs text-[var(--muted)]">
        Already ran a search?{" "}
        <Link href="/home" className="font-medium text-[var(--brand)] hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
