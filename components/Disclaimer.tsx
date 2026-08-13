import { SITE_DETERMINES } from "@/lib/copy";

/** Required disclaimer shown on every trial card and detail page. */
export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <p
      className={`flex items-start gap-1.5 text-xs text-slate-500 ${className}`}
    >
      <span aria-hidden className="mt-0.5">
        ⓘ
      </span>
      <span>{SITE_DETERMINES}</span>
    </p>
  );
}
