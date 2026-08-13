import { SourceChip as SourceChipType } from "@/lib/types";

export function SourceChip({ chip }: { chip: SourceChipType }) {
  return (
    <a
      href={chip.href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-2.5 py-1 text-xs font-medium text-[color:var(--ink)]"
    >
      {chip.label}
    </a>
  );
}
