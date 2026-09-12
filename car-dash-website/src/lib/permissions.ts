import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";
import { OWNER_EMAIL } from "@/lib/constants";
import {
  ADMIN_DEFAULT_PERMISSIONS,
  ALL_STAFF_PERMISSION_KEYS,
  sanitizePermissions,
  type StaffPermission,
} from "@/lib/access-control";
import { ensureAccessControlSchema } from "@/lib/access-schema";

export type CurrentAccount = {
  id: string;
  email: string;
  role: string;
  name: string;
  permissions: StaffPermission[];
  customRoles: { id: string; name: string }[];
};

export function parseRolePermissions(value: string | null | undefined): StaffPermission[] {
  if (!value) return [];
  try {
    return sanitizePermissions(JSON.parse(value));
  } catch {
    return [];
  }
}

export function resolvePermissionSnapshot(input: {
  email: string;
  role: string;
  assignments?: { role: { id: string; name: string; permissionsJson: string | null } }[];
  overrides?: { permission: string; allowed: boolean }[];
}) {
  const effectiveRole =
    input.email.toLowerCase() === OWNER_EMAIL.toLowerCase() ? "owner" : input.role;

  if (effectiveRole === "owner") {
    return {
      role: "owner",
      permissions: [...ALL_STAFF_PERMISSION_KEYS],
      customRoles: [] as { id: string; name: string }[],
      staffAccess: true,
    };
  }

  const granted = new Set<StaffPermission>();
  if (effectiveRole === "admin") {
    ADMIN_DEFAULT_PERMISSIONS.forEach((permission) => granted.add(permission));
  }

  for (const assignment of input.assignments || []) {
    parseRolePermissions(assignment.role.permissionsJson).forEach((permission) => granted.add(permission));
  }

  for (const override of input.overrides || []) {
    const permission = override.permission as StaffPermission;
    if (!ALL_STAFF_PERMISSION_KEYS.includes(permission)) continue;
    if (override.allowed) granted.add(permission);
    else granted.delete(permission);
  }

  const permissions = ALL_STAFF_PERMISSION_KEYS.filter((permission) => granted.has(permission));
  return {
    role: effectiveRole,
    permissions,
    customRoles: (input.assignments || []).map((assignment) => ({ id: assignment.role.id, name: assignment.role.name })),
    staffAccess: permissions.length > 0 || effectiveRole === "admin",
  };
}

export async function getPermissionSnapshotForUser(user: {
  id: string;
  email: string;
  role: string;
  name?: string;
}) {
  const effectiveRole =
    user.email.toLowerCase() === OWNER_EMAIL.toLowerCase() ? "owner" : user.role;

  if (effectiveRole === "owner") {
    return resolvePermissionSnapshot({ email: user.email, role: "owner" });
  }

  await ensureAccessControlSchema();

  const [assignments, overrides] = await Promise.all([
    prisma.customRoleAssignment.findMany({
      where: { userId: user.id },
      include: { role: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.userPermissionOverride.findMany({
      where: { userId: user.id },
    }),
  ]);

  return resolvePermissionSnapshot({
    email: user.email,
    role: effectiveRole,
    assignments,
    overrides,
  });
}

export async function getCurrentAccountFromRequest(
  request: NextRequest
): Promise<CurrentAccount | null> {
  const token = getAuthFromRequest(request);
  if (!token) return null;

  const user = await prisma.user.findUnique({
    where: { id: token.id },
    select: { id: true, email: true, role: true, name: true },
  });

  if (!user) return null;

  const snapshot = await getPermissionSnapshotForUser(user);

  return {
    ...user,
    role: snapshot.role,
    permissions: snapshot.permissions,
    customRoles: snapshot.customRoles,
  };
}

export function isOwnerAccount(account: CurrentAccount | null) {
  return Boolean(account && account.role === "owner");
}

export function isStaffAccount(account: CurrentAccount | null) {
  return Boolean(account && (account.role === "owner" || account.role === "admin" || account.permissions.length > 0));
}

export function hasStaffPermission(account: CurrentAccount | null, permission: StaffPermission) {
  return Boolean(account && (account.role === "owner" || account.permissions.includes(permission)));
}

export function hasAnyStaffPermission(account: CurrentAccount | null, permissions: StaffPermission[]) {
  return Boolean(account && (account.role === "owner" || permissions.some((permission) => account.permissions.includes(permission))));
}
