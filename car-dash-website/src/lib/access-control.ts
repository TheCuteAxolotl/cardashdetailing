export const STAFF_PERMISSIONS = [
  { key: "staffGuide", label: "Staff Guide", description: "Read Car Dash rules, scripts, professionalism standards, and communication playbooks." },
  { key: "bookings", label: "Bookings & Booking Chat", description: "View bookings, update booking status, use booking chat, and send arrival updates." },
  { key: "smsInbox", label: "SMS Inbox", description: "View incoming customer SMS replies and reply from booking conversations." },
  { key: "quoteChats", label: "Quote Chats", description: "Review quote requests, photos, messages, and send exact quotes." },
  { key: "support", label: "Support", description: "View support tickets, reply to customers, and update ticket status." },
  { key: "businessPhone", label: "Business Phone", description: "View call history, listen to voicemail, and manage blocked callers." },
  { key: "warranties", label: "Ceramic Warranties", description: "View, create, and manage ceramic coating warranty records." },
  { key: "analytics", label: "Analytics", description: "View booking, quote, customer, and booked-value analytics." },
  { key: "services", label: "Services", description: "Create, edit, activate, and remove public service listings." },
  { key: "gallery", label: "Photos & Media", description: "Upload, relabel, and remove website gallery/media assets." },
  { key: "website", label: "Website Editor", description: "Edit public website copy and homepage content." },
  { key: "pricing", label: "Pricing & Discounts", description: "Edit package pricing, booking add-ons, and discount codes." },
] as const;

export type StaffPermission = (typeof STAFF_PERMISSIONS)[number]["key"];

export const ALL_STAFF_PERMISSION_KEYS = STAFF_PERMISSIONS.map((item) => item.key) as StaffPermission[];

export const ADMIN_DEFAULT_PERMISSIONS: StaffPermission[] = [
  "staffGuide",
  "bookings",
  "smsInbox",
  "quoteChats",
  "support",
];

export function isStaffPermission(value: unknown): value is StaffPermission {
  return typeof value === "string" && ALL_STAFF_PERMISSION_KEYS.includes(value as StaffPermission);
}

export function sanitizePermissions(values: unknown): StaffPermission[] {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(values.filter(isStaffPermission)));
}

export const PERMISSION_ROUTES: Record<StaffPermission, string> = {
  staffGuide: "/staff-guide",
  bookings: "/admin/bookings",
  smsInbox: "/admin/messages",
  quoteChats: "/admin/quotes",
  support: "/admin/support",
  businessPhone: "/owner/calls",
  warranties: "/owner/warranties",
  analytics: "/owner/analytics",
  services: "/owner/services",
  gallery: "/owner/gallery",
  website: "/owner/website",
  pricing: "/owner/pricing-pages",
};
