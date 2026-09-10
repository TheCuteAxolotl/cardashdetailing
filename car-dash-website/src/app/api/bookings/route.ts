import { NextRequest, NextResponse } from "next/server";
import Twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? Twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      )
    : null;

const notifyNumbers =
  process.env.TWILIO_NOTIFY_NUMBERS?.split(",")
    .map((number) => number.trim())
    .filter(Boolean) ?? [];

function required(form: FormData, key: string) {
  const value = String(form.get(key) ?? "").trim();

  if (!value) {
    throw new Error(`Missing required field: ${key}`);
  }

  return value;
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

    const bookings = await prisma.booking.findMany({
      where:
        auth.role === "owner"
          ? {}
          : {
              userId: auth.id,
            },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(bookings, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch bookings:", error);

    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();

    const name = required(form, "name");
    const phone = required(form, "phone");
    const email = required(form, "email");

    const vehicleMake = required(form, "vehicleMake");
    const vehicleModel = required(form, "vehicleModel");
    const vehicleYear = required(form, "vehicleYear");

    const serviceName = String(
      form.get("selectedPackage") || "Custom Booking"
    );

    const serviceMethod = String(
      form.get("serviceMethod") || "shop"
    );

    const preferredDate = String(
      form.get("preferredDate") || ""
    );

    const details = [
      `Vehicle type: ${String(
        form.get("vehicleType") || "Not specified"
      )}`,
      `Preferred time: ${String(
        form.get("preferredTime") || "Not specified"
      )}`,
      `Service address: ${String(
        form.get("serviceAddress") || "Not specified"
      )}`,
      `Interior condition: ${String(
        form.get("interiorCondition") || "Not specified"
      )}`,
      `Exterior condition: ${String(
        form.get("exteriorCondition") || "Not specified"
      )}`,
      `Add-ons: ${String(form.get("addOns") || "[]")}`,
      `SMS consent: ${String(
        form.get("smsConsent") || "false"
      )}`,
      `Customer notes: ${String(
        form.get("serviceNotes") || "None"
      )}`,
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
        vehicleTrim: String(form.get("vehicleTrim") || ""),
        preferredDate,
        notes: details,
      },
    });

    if (
      twilioClient &&
      process.env.TWILIO_FROM_NUMBER &&
      notifyNumbers.length
    ) {
      const body =
        `New Car Dash booking\n` +
        `${name} - ${phone}\n` +
        `${vehicleYear} ${vehicleMake} ${vehicleModel}\n` +
        `${serviceName} (${serviceMethod})\n` +
        `Preferred: ${preferredDate || "Not specified"}`;

      await Promise.allSettled(
        notifyNumbers.map((to) =>
          twilioClient.messages.create({
            body,
            from: process.env.TWILIO_FROM_NUMBER!,
            to,
          })
        )
      );
    }

    return NextResponse.json(
      {
        success: true,
        booking,
        message: "Booking request submitted. We’ll contact you shortly.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Booking submission error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to process booking request.",
      },
      { status: 400 }
    );
  }
}
