import type { ReactNode } from "react";

export type OwnerIconName =
  | "calendar" | "users" | "message" | "quote" | "receipt" | "calculator"
  | "book" | "chart" | "gift" | "globe" | "bell" | "phone" | "support"
  | "arrow-up-right" | "chevron-right" | "chevron-left" | "check" | "activity";

const drawings: Record<OwnerIconName, ReactNode> = {
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0M17 11a3 3 0 0 0 0-6M17 15a5 5 0 0 1 4 5" /></>,
  message: <><path d="M20 17a2 2 0 0 1-2 2H8l-5 3V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2Z"/><path d="M7 9h10M7 13h7"/></>,
  quote: <><path d="M8 4H5a2 2 0 0 0-2 2v14h18V6a2 2 0 0 0-2-2h-3M8 4v5l4-2 4 2V4" /><path d="M8 13h8M8 17h5" /></>,
  receipt: <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  calculator: <><rect x="4" y="2" width="16" height="20" rx="2"/><rect x="7" y="5" width="10" height="4" rx=".5"/><path d="M8 13h1M12 13h1M16 13h1M8 17h1M12 17h1M16 17h1"/></>,
  book: <><path d="M3 5a3 3 0 0 1 3-3h6v19H6a3 3 0 0 0-3 1ZM21 5a3 3 0 0 0-3-3h-6v19h6a3 3 0 0 1 3 1Z"/></>,
  chart: <><path d="M3 3v18h18M7 16l5-6 4 3 5-8"/></>,
  gift: <><rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 13h18M12 9v12M12 9H7a3 3 0 1 1 3-3c1 2 2 3 2 3ZM12 9h5a3 3 0 1 0-3-3c-1 2-2 3-2 3Z"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  phone: <><path d="M7 3 4 5c-1 1 0 4 4 9s8 7 10 6l3-4-5-3-2 2c-2-1-4-3-5-5l2-2-4-5Z"/></>,
  support: <><circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5M12 17v.5"/></>,
  "arrow-up-right": <><path d="M5 19 19 5M8 5h11v11"/></>,
  "chevron-right": <path d="m9 5 7 7-7 7"/>,
  "chevron-left": <path d="m15 5-7 7 7 7"/>,
  check: <path d="m4 12 5 5L20 6"/>,
  activity: <><path d="M3 12h4l3-7 4 14 3-7h4"/></>,
};

export default function OwnerAppIcon({name, className = "h-5 w-5"}: {name: OwnerIconName; className?: string}) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {drawings[name]}
  </svg>;
}
