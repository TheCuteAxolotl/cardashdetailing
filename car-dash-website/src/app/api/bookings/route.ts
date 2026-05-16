import { NextResponse, NextRequest } from "next/server";
import Twilio from "twilio";
import { PrismaClient } from "@prisma/client";
import { getAuthFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;
const notifyNumbers = process.env.TWILIO_NOTIFY_NUMBERS?.split(",").map((num) => num.trim()).filter(Boolean) ?? [];

const twilioClient = accountSid && authToken ? Twilio(accountSid, authToken) : null;

function getRequired(value: FormDataEntryValue | null, fieldName: string): string {
  if (!value) {
    throw new Error(`Missing required field: ${fieldName}`);
  }

  return String(value);
}

async function sendSmsNotification(body: string) {
  if (!twilioClient || !fromNumber || !notifyNumbers.length) {
    console.log("Booking request received without Twilio configured:", body);
    return false;
  }

  await Promise.all(
    notifyNumbers.map((to) =>
      twilioClient.messages.create({
        body,
        from: fromNumber,
        to,
      })
    )
  );
  return true;
}

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const where = auth.role === "owner" ? {} : { userId: auth.id };

    const bookings = await prisma.booking.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookings, { status: 200 });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = getRequired(formData.get("name"), "name");
    const phone = getRequired(formData.get("phone"), "phone");
    const email = getRequired(formData.get("email"), "email");
    const vehicleMake = getRequired(formData.get("vehicleMake"), "vehicleMake");
    const vehicleModel = getRequired(formData.get("vehicleModel"), "vehicleModel");
    const vehicleYear = getRequired(formData.get("vehicleYear"), "vehicleYear");
    const vehicleTrim = String(formData.get("vehicleTrim") ?? "");
    const serviceNotes = String(formData.get("serviceNotes") ?? "");
    const preferredDate = String(formData.get("preferredDate") ?? "");
    const serviceName = String(formData.get("selectedPackage") ?? "Custom Booking");
    const serviceMethod = String(formData.get("serviceMethod") ?? "shop");
    const auth = getAuthFromRequest(request as unknown as NextRequest);

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
        notes: serviceNotes,
      },
    });

    const messageBody = `New booking request from ${name}\nPhone: ${phone}\nEmail: ${email}\nVehicle: ${vehicleYear} ${vehicleMake} ${vehicleModel} ${vehicleTrim ? `(${vehicleTrim})` : ""}\nPreferred: ${preferredDate}\nService: ${serviceName} (${serviceMethod})\nNotes: ${serviceNotes || "None"}`;
    await sendSmsNotification(messageBody);

    return NextResponse.json({
      success: true,
      booking,
      message: "Booking request submitted. We’ll contact you shortly.",
    }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to process booking request.",
    }, { status: 400 });
  }
}
