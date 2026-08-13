import { VERDICT_LABEL } from "@/lib/copy";
import type { Verdict } from "@/lib/types";

const STYLES: Record<Verdict, string> = {
  likely_eligible: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  needs_info: "bg-amber-50 text-amber-700 ring-amber-600/20",
  likely_ineligible: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const DOT: Record<Verdict, string> = {
  likely_eligible: "bg-emerald-500",
  needs_info: "bg-amber-500",
  likely_ineligible: "bg-slate-400",
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STYLES[verdict]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[verdict]}`} />
      {VERDICT_LABEL[verdict]}
    </span>
  );
}
