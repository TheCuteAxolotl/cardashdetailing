import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, isStaffAccount } from "@/lib/permissions";

async function access(request: NextRequest, id: string) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!auth) return null;
  const thread = await prisma.quoteThread.findUnique({ where: { id }, select: { id: true, userId: true, lastCustomerSeenAt: true } });
  if (!thread) return null;
  if (!isStaffAccount(auth) && thread.userId !== auth.id) return null;
  return { auth, thread, staff: isStaffAccount(auth) };
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const allowed = await access(request, id);
  if (!allowed) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  if (!allowed.staff) await prisma.quoteThread.update({ where: { id }, data: { lastCustomerSeenAt: new Date() } });
  const thread = await prisma.quoteThread.findUnique({
    where: { id }, include: { user: { select: { id: true, name: true, email: true } }, vehicle: true, service: true, messages: { orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json(thread);
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const allowed = await access(request, id);
  if (!allowed) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const body = await request.json();
  const message = String(body.message || "").trim().slice(0, 3000);
  const attachments = Array.isArray(body.attachments) ? body.attachments.slice(0, 3) : [];
  if (!message && !attachments.length) return NextResponse.json({ error: "Message required" }, { status: 400 });
  await prisma.quoteMessage.create({ data: { threadId: id, sender: allowed.staff ? "team" : "customer", body: message || "Photo attachment", attachmentsJson: attachments.length ? JSON.stringify(attachments) : null } });
  await prisma.quoteThread.update({ where: { id }, data: allowed.staff ? {} : { lastCustomerSeenAt: new Date() } });
  // Twilio hook intentionally deferred. A future SMS should only send for team replies when
  // lastCustomerSeenAt is stale (for example > 90 seconds), and link directly to /quote?thread=<id>.
  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const allowed = await access(request, id);
  if (!allowed) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const body = await request.json();
  if (allowed.staff) {
    const quotedPrice = body.quotedPrice === "" || body.quotedPrice == null ? null : Number(body.quotedPrice);
    const updated = await prisma.quoteThread.update({ where: { id }, data: {
      status: String(body.status || "quoted"), quotedPrice: Number.isFinite(quotedPrice) ? quotedPrice : null,
      quoteNotes: String(body.quoteNotes || "").trim() || null,
    }});
    return NextResponse.json(updated);
  }
  if (body.action === "accept") {
    const updated = await prisma.quoteThread.update({ where: { id }, data: { status: "accepted", acceptedAt: new Date(), lastCustomerSeenAt: new Date() } });
    return NextResponse.json(updated);
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
