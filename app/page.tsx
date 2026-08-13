import { IntakeForm } from "@/components/IntakeForm";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Find clinical trials worth asking about
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
          Tell us about your situation. TrialLens searches currently recruiting
          trials and compares your profile against each trial&rsquo;s eligibility
          criteria, one line at a time — so you can walk into your next
          appointment with a focused list of questions.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <IntakeForm />
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
        <p className="font-medium text-slate-600">A note on how to use this</p>
        <p className="mt-1">
          TrialLens never tells you that you qualify for a trial. It highlights
          trials that may be <span className="font-medium">worth asking your
          care team about</span>, and flags exactly what information a trial
          site would still need. Final eligibility is determined by the trial
          site, not this tool.
        </p>
      </section>
    </div>
  );
}
