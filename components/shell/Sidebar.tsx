"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { JOURNEY_NAV, RESOURCE_NAV, isActive, type NavItem } from "./nav";

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(item.href, pathname);
  const className = `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
    active
      ? "bg-[var(--brand-soft)] font-semibold text-[var(--brand)]"
      : "text-[var(--muted)] hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)]"
  }`;

  if (item.external) {
    return (
      <a href={item.href} className={className}>
        <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
        <span className="truncate">{item.label}</span>
      </a>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={className}
    >
      <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--line)] bg-[var(--surface)] lg:flex">
      <Link
        href="/"
        className="flex items-center gap-2.5 border-b border-[var(--line)] px-5 py-[18px]"
      >
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
            <path d="M12 20.5S3.5 15 3.5 9.2A4.7 4.7 0 0 1 12 6.4a4.7 4.7 0 0 1 8.5 2.8c0 5.8-8.5 11.3-8.5 11.3z" />
          </svg>
        </span>
        <span className="leading-tight">
          <span className="block text-[15px] font-bold text-[var(--foreground)]">
            Bridge
          </span>
          <span className="block text-[11px] text-[var(--muted)]">
            Your healthcare advocate
          </span>
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {JOURNEY_NAV.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        <div className="my-3 border-t border-[var(--line)]" />

        <div className="space-y-1">
          {RESOURCE_NAV.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      </nav>

      <div className="m-3 rounded-2xl bg-[var(--brand-soft)] p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[var(--brand)]">
            <Icon name="settings" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold leading-snug text-[var(--foreground)]">
              Settings
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--muted)]">
              Profile setup, language preferences, and delete controls all live here now.
            </p>
          </div>
        </div>
        <Link
          href="/settings"
          className="mt-3 block min-h-11 rounded-xl bg-[var(--brand)] px-3 py-3 text-center text-[13px] font-semibold text-white hover:bg-[var(--brand-strong)]"
        >
          Open settings
        </Link>
      </div>
    </aside>
  );
}

/** Horizontal nav shown instead of the sidebar on small screens. */
export function MobileNav() {
  const pathname = usePathname();
  const items = [...JOURNEY_NAV, ...RESOURCE_NAV];

  return (
    <nav className="flex gap-1.5 overflow-x-auto border-b border-[var(--line)] bg-[var(--surface)] px-3 py-2 lg:hidden">
      {items.map((item) => {
        const active = !item.external && isActive(item.href, pathname);
        const className = `flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${
          active
            ? "bg-[var(--brand-soft)] font-semibold text-[var(--brand)]"
            : "text-[var(--muted)]"
        }`;

        if (item.external) {
          return (
            <a key={item.href} href={item.href} className={className}>
              <Icon name={item.icon} className="h-4 w-4" />
              {item.label}
            </a>
          );
        }

        return (
          <Link key={item.href} href={item.href} className={className}>
            <Icon name={item.icon} className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
