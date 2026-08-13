// Single source of truth for sidebar navigation.

import { VISIT_APP_URL } from "@/lib/visitApp";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  /** Sections that are visible but not yet built out. */
  placeholder?: boolean;
  /** Opens the live visit companion instead of an in-app route. */
  external?: boolean;
}

export const JOURNEY_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/before", label: "Before Appointment", icon: "calendar", placeholder: true },
  { href: "/during", label: "During Appointment", icon: "pulse", placeholder: true },
  { href: "/after", label: "After Appointment", icon: "clock", placeholder: true },
  { href: VISIT_APP_URL, label: "Live visit", icon: "globe", external: true },
];

export const RESOURCE_NAV: NavItem[] = [
  { href: "/treatment-options", label: "Treatment Options", icon: "target", placeholder: true },
  { href: "/profile", label: "Clinical Trials", icon: "flask" },
  { href: "/second-opinions", label: "Second Opinions", icon: "users", placeholder: true },
  { href: "/saved", label: "Saved & Notes", icon: "bookmark" },
];

/** Account / utility links that should always appear in the same place. */
export const ACCOUNT_NAV: NavItem[] = [
  { href: "/settings", label: "Settings", icon: "settings" },
];

export const ALL_NAV = [...JOURNEY_NAV, ...RESOURCE_NAV, ...ACCOUNT_NAV];

/**
 * The Clinical Trials section owns several routes, so highlight it for any of
 * them rather than only its literal href.
 */
const TRIALS_ROUTES = ["/profile", "/matches", "/trial", "/questions"];

export function isActive(href: string, pathname: string): boolean {
  if (href.startsWith("http://") || href.startsWith("https://")) return false;
  if (href === "/profile") {
    return TRIALS_ROUTES.some(
      (r) => pathname === r || pathname.startsWith(`${r}/`),
    );
  }
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
