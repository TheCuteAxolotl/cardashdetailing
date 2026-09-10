import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";
import { OWNER_EMAIL } from "@/lib/constants";

export type CurrentAccount = {
  id: string;
  email: string;
  role: string;
  name: string;
};

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

  const role =
    user.email.toLowerCase() === OWNER_EMAIL.toLowerCase()
      ? "owner"
      : user.role;

  return { ...user, role };
}

export function isOwnerAccount(account: CurrentAccount | null) {
  return Boolean(account && account.role === "owner");
}

export function isStaffAccount(account: CurrentAccount | null) {
  return Boolean(account && (account.role === "owner" || account.role === "admin"));
}
