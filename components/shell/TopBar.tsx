import { Icon } from "./Icon";

export function TopBar() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] bg-white px-4 py-3 sm:px-6">
      <p className="hidden items-center gap-2 text-[13px] text-[var(--muted)] sm:flex">
        <Icon name="shield" className="h-4 w-4 text-emerald-500" />
        Private. Secure. You&rsquo;re in control.
      </p>

      <div className="ml-auto flex items-center gap-3">
        <span className="rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-xs font-medium text-slate-600">
          EN
        </span>
        <span className="relative grid h-9 w-9 place-items-center text-slate-500">
          <Icon name="bell" className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </span>
        <span className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--brand-soft)] text-[13px] font-semibold text-[var(--brand)]">
            M
          </span>
          <span className="hidden text-sm font-medium text-slate-800 sm:block">
            Mercedes
          </span>
        </span>
      </div>
    </header>
  );
}
