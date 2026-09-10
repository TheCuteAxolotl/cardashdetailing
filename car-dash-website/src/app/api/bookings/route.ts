import { NextRequest, NextResponse } from "next/server";
import Twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";
import { getClientIp, hashVisitor } from "@/lib/support-security";

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN ? Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;
const notifyNumbers = process.env.TWILIO_NOTIFY_NUMBERS?.split(",").map((n) => n.trim()).filter(Boolean) ?? [];
function required(form: FormData, key: string) { const value = String(form.get(key) ?? "").trim(); if (!value) throw new Error(`Missing required field: ${key}`); return value; }

async function discordBooking(data: Record<string,string>) {
  const url = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!url) return;
  const lines = [
    "**New detailing request**",
    `Customer: ${data.name}`,
    `Phone: ${data.phone}`,
    `Email: ${data.email}`,
    `Vehicle: ${data.vehicle}`,
    `Service: ${data.service}`,
    `Preferred: ${data.preferred}`,
    `Address: ${data.address || "Not specified"}`,
    `Notes: ${data.notes || "None"}`,
    "",
    `IP: ${data.ip}`,
    `Visitor hash: ${data.visitorHash}`,
  ].join("\n");
  try { await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: lines.slice(0,1950), username: "Car Dash Detailing" }) }); }
  catch (error) { console.error("Discord booking notification failed:", error); }
}

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const bookings = await prisma.booking.findMany({ where: auth.role === "owner" ? {} : { userId: auth.id }, include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" } });
    return NextResponse.json(bookings);
  } catch (error) { console.error("Failed to fetch bookings:", error); return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request); const visitorHash = hashVisitor(ip);
    const blocked = await prisma.blockedVisitor.findUnique({ where: { hash: visitorHash } });
    if (blocked) return NextResponse.json({ success: false, message: "Booking requests are unavailable from this connection." }, { status: 403 });
    const recent = await prisma.booking.count({ where: { createdAt: { gte: new Date(Date.now() - 20*60*1000) } } });
    if (recent > 1000) return NextResponse.json({ success:false, message:"Please try again later." }, { status:429 });

    const form = await request.formData();
    const name=required(form,"name"), phone=required(form,"phone"), email=required(form,"email"), vehicleMake=required(form,"vehicleMake"), vehicleModel=required(form,"vehicleModel"), vehicleYear=required(form,"vehicleYear");
    const vehicleTrim=String(form.get("vehicleTrim")||"").trim(), serviceName=String(form.get("selectedPackage")||"Custom Booking").trim(), serviceMethod=String(form.get("serviceMethod")||"Not specified").trim(), preferredDate=String(form.get("preferredDate")||"").trim(), preferredTime=String(form.get("preferredTime")||"").trim(), serviceAddress=String(form.get("serviceAddress")||"").trim(), customerNotes=String(form.get("serviceNotes")||"None").trim();
    const details=[`Vehicle type: ${String(form.get("vehicleType")||"Not specified")}`,`Preferred time: ${preferredTime||"Not specified"}`,`Service address: ${serviceAddress||"Not specified"}`,`Interior condition: ${String(form.get("interiorCondition")||"Not specified")}`,`Exterior condition: ${String(form.get("exteriorCondition")||"Not specified")}`,`Add-ons: ${String(form.get("addOns")||"[]")}`,`SMS consent: ${String(form.get("smsConsent")||"false")}`,`Customer notes: ${customerNotes}`].join("\n");
    const auth=getAuthFromRequest(request);
    const booking=await prisma.booking.create({ data:{ userId:auth?.id??null, serviceName, serviceMethod, customerName:name, customerEmail:email, customerPhone:phone, vehicleMake, vehicleModel, vehicleYear, vehicleTrim, preferredDate, notes:details } });
    await discordBooking({ name, phone, email, vehicle:[vehicleYear,vehicleMake,vehicleModel,vehicleTrim].filter(Boolean).join(" "), service:serviceName, preferred:[preferredDate,preferredTime].filter(Boolean).join(" · ")||"Not specified", address:serviceAddress, notes:customerNotes, ip, visitorHash });
    if (twilioClient && process.env.TWILIO_FROM_NUMBER && notifyNumbers.length) { const body=`New Car Dash booking\n${name} - ${phone}\n${vehicleYear} ${vehicleMake} ${vehicleModel}\n${serviceName}\nPreferred: ${preferredDate||"Not specified"}`; await Promise.allSettled(notifyNumbers.map(to=>twilioClient.messages.create({body,from:process.env.TWILIO_FROM_NUMBER!,to}))); }
    return NextResponse.json({ success:true, booking, message:"Booking request submitted. Car Dash will follow up shortly." }, { status:201 });
  } catch(error){ console.error("Booking submission error:",error); return NextResponse.json({ success:false, message:error instanceof Error?error.message:"Unable to process booking request." }, { status:400 }); }
}
