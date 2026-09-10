import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";
import { getVisitorHash, getVisitorIp, isVisitorBlocked } from "@/lib/visitor-security";
import { sendDiscordEmbed } from "@/lib/discord";

function required(form: FormData, key: string) {
  const value = String(form.get(key) ?? "").trim();
  if (!value) throw new Error(`Missing required field: ${key}`);
  return value;
}

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const bookings = await prisma.booking.findMany({
      where: auth.role === "owner" ? {} : { userId: auth.id },
      select: {
        id: true,
        userId: true,
        serviceName: true,
        serviceMethod: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        vehicleMake: true,
        vehicleModel: true,
        vehicleYear: true,
        vehicleTrim: true,
        preferredDate: true,
        notes: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookings, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const visitorHash = getVisitorHash(request);
    const visitorIp = getVisitorIp(request);

    if (await isVisitorBlocked(visitorHash)) {
      return NextResponse.json(
        { success: false, message: "Booking requests from this connection are currently blocked." },
        { status: 403 }
      );
    }

    const recentBookings = await prisma.booking.count({
      where: {
        visitorHash,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });

    if (recentBookings >= 4) {
      return NextResponse.json(
        { success: false, message: "Too many booking requests. Please wait before trying again." },
        { status: 429 }
      );
    }

    const form = await request.formData();
    const name = required(form, "name");
    const phone = required(form, "phone");
    const email = required(form, "email");
    const vehicleMake = required(form, "vehicleMake");
    const vehicleModel = required(form, "vehicleModel");
    const vehicleYear = required(form, "vehicleYear");
    const vehicleTrim = String(form.get("vehicleTrim") || "").trim();
    const serviceName = String(form.get("selectedPackage") || "Custom Booking").trim();
    const serviceMethod = String(form.get("serviceMethod") || "Not specified").trim();
    const preferredDate = String(form.get("preferredDate") || "").trim();
    const preferredTime = String(form.get("preferredTime") || "").trim();
    const serviceAddress = String(form.get("serviceAddress") || "").trim();
    const vehicleType = String(form.get("vehicleType") || "Not specified").trim();
    const interiorCondition = String(form.get("interiorCondition") || "Not specified").trim();
    const exteriorCondition = String(form.get("exteriorCondition") || "Not specified").trim();
    const addOns = String(form.get("addOns") || "None").trim();
    const smsConsent = String(form.get("smsConsent") || "false").trim();
    const customerNotes = String(form.get("serviceNotes") || "None").trim();

    const details = [
      `Vehicle type: ${vehicleType}`,
      `Preferred time: ${preferredTime || "Not specified"}`,
      `Service address: ${serviceAddress || "Not specified"}`,
      `Interior condition: ${interiorCondition}`,
      `Exterior condition: ${exteriorCondition}`,
      `Add-ons: ${addOns}`,
      `SMS consent: ${smsConsent}`,
      `Customer notes: ${customerNotes}`,
    ].join("\n");

    const auth = getAuthFromRequest(request);
    const booking = await prisma.booking.create({
      data: {
        userId: auth?.id ?? null,
        serviceName,
        serviceMethod,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        vehicleMake,
        vehicleModel,
        vehicleYear,
        vehicleTrim,
        preferredDate,
        notes: details,
        visitorHash,
      },
    });

    await sendDiscordEmbed({
      webhookUrl: process.env.DISCORD_WEBHOOK_URL,
      title: "New detailing request",
      description: "A new booking request came in through cardashdetailing.com.",
      fields: [
        { name: "Customer", value: name, inline: true },
        { name: "Phone", value: phone, inline: true },
        { name: "Email", value: email, inline: false },
        { name: "Vehicle", value: `${vehicleYear} ${vehicleMake} ${vehicleModel} ${vehicleTrim}`.trim(), inline: false },
        { name: "Service", value: serviceName, inline: true },
        { name: "Method", value: serviceMethod, inline: true },
        { name: "Preferred", value: `${preferredDate || "No date"} ${preferredTime || ""}`.trim(), inline: false },
        { name: "Address", value: serviceAddress || "Not provided", inline: false },
        { name: "Notes", value: customerNotes || "None", inline: false },
        { name: "IP", value: visitorIp, inline: false },
        { name: "Visitor hash", value: visitorHash, inline: false },
      ],
      footer: "Use the visitor hash in Owner Dashboard → Support to block spam. IP/hash are not shown on the website.",
    });

    return NextResponse.json(
      {
        success: true,
        booking: {
          id: booking.id,
          serviceName: booking.serviceName,
          status: booking.status,
          preferredDate: booking.preferredDate,
          createdAt: booking.createdAt,
        },
        message: "Booking request sent. Car Dash will follow up to confirm the details.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Booking submission error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unable to process booking request." },
      { status: 400 }
    );
  }
}
