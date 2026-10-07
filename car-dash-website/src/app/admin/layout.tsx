"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import OwnerShell from "@/components/OwnerShell";

type AccessState = "checking" | "allowed" | "redirecting";
type User = { id: string; name?: string | null; email?: string | null; role?: string | null };

const ADMIN_ROUTE_PERMISSIONS: Array<{ prefix: string; permission: string }> = [
  { prefix: "/admin/bookings", permission: "bookings" },
  { prefix: "/admin/messages", permission: "smsInbox" },
  { prefix: "/admin/quotes", permission: "quoteChats" },
  { prefix: "/admin/support", permission: "support" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<AccessState>("checking");
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);

  const requiredPermission = useMemo(
    () => ADMIN_ROUTE_PERMISSIONS.find((item) => pathname.startsWith(item.prefix))?.permission || null,
    [pathname]
  );

  useEffect(() => {
    let cancelled = false;
    setState("checking");

    (async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) {
            setState("redirecting");
            window.location.assign("/login");
          }
          return;
        }

        const data = await response.json();
        const role = String(data.user?.role || "user");
        const nextPermissions = Array.isArray(data.permissions) ? data.permissions : [];

        if (role === "owner") {
          if (!cancelled) {
            setState("redirecting");
            window.location.assign("/owner/dashboard");
          }
          return;
        }

        if (!data.staffAccess) {
          if (!cancelled) {
            setState("redirecting");
            window.location.assign("/dashboard");
          }
          return;
        }

        if (requiredPermission && !nextPermissions.includes(requiredPermission)) {
          if (!cancelled) {
            setState("redirecting");
            window.location.assign("/admin/dashboard");
          }
          return;
        }

        if (!cancelled) {
          setUser(data.user);
          setPermissions(nextPermissions);
          setState("allowed");
        }
      } catch {
        if (!cancelled) {
          setState("redirecting");
          window.location.assign("/login");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [requiredPermission]);

  if (state !== "allowed" || !user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f3f0e8] px-6 text-[#171411]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-b-black" />
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[.16em] text-black/32">Opening staff workspace</p>
        </div>
      </main>
    );
  }

  return <OwnerShell user={user} permissions={permissions}>{children}</OwnerShell>;
}
