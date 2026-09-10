import { NextRequest, NextResponse } from "next/server";
import Twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";

const DISCORD_USER_ID = "1547633071535165480";

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

function cleanDiscordText(value: string, maxLength = 1000) {
  const cleaned = String(value || "").trim();

  if (!cleaned) {
    return "Not specified";
  }

  return cleaned.slice(0, maxLength);
}

async function sendDiscordNotification(data: {
  bookingId: string;
  name: string;
  phone: string;
  email: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleTrim: string;
  serviceName: string;
  serviceMethod: string;
  preferredDate: string;
  preferredTime: string;
  serviceAddress: string;
  vehicleType: string;
  interiorCondition: string;
  exteriorCondition: string;
  addOns: string;
  customerNotes: string;
}) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL?.trim();

  if (!webhookUrl) {
    console.error("DISCORD_WEBHOOK_URL is missing.");
    return;
  }

  try {
    const vehicle = [
      data.vehicleYear,
      data.vehicleMake,
      data.vehicleModel,
      data.vehicleTrim,
    ]
      .filter(Boolean)
      .join(" ");

    const response = await fetch(`${webhookUrl}?wait=true`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        content: `<@${DISCORD_USER_ID}> New detailing request received!`,

        allowed_mentions: {
          users: [DISCORD_USER_ID],
        },

        username: "Car Dash Detailing",

        embeds: [
          {
            title: "🚗 New Detailing Request",

            description:
              "A customer submitted a new detailing request through cardashdetailing.com.",

            color: 15548997,

            fields: [
              {
                name: "Customer",
                value: cleanDiscordText(data.name),
                inline: true,
              },
              {
                name: "Phone",
                value: cleanDiscordText(data.phone),
                inline: true,
              },
              {
                name: "Email",
                value: cleanDiscordText(data.email),
                inline: false,
              },
              {
                name: "Vehicle",
                value: cleanDiscordText(vehicle),
                inline: false,
              },
              {
                name: "Vehicle Type",
                value: cleanDiscordText(data.vehicleType),
                inline: true,
              },
              {
                name: "Service",
                value: cleanDiscordText(data.serviceName),
                inline: true,
              },
              {
                name: "Service Method",
                value: cleanDiscordText(data.serviceMethod),
                inline: true,
              },
              {
                name: "Preferred Date",
                value: cleanDiscordText(data.preferredDate),
                inline: true,
              },
              {
                name: "Preferred Time",
                value: cleanDiscordText(data.preferredTime),
                inline: true,
              },
              {
                name: "Service Address",
                value: cleanDiscordText(data.serviceAddress),
                inline: false,
              },
              {
                name: "Interior Condition",
                value: cleanDiscordText(data.interiorCondition),
                inline: true,
              },
              {
                name: "Exterior Condition",
                value: cleanDiscordText(data.exteriorCondition),
                inline: true,
              },
              {
                name: "Add-ons",
                value: cleanDiscordText(data.addOns),
                inline: false,
              },
              {
                name: "Customer Notes",
                value: cleanDiscordText(data.customerNotes),
                inline: false,
              },
              {
                name: "Booking ID",
                value: cleanDiscordText(data.bookingId),
                inline: false,
              },
            ],

            footer: {
              text: "Car Dash Detailing • Website Booking",
            },

            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "Discord webhook failed:",
        response.status,
        response.statusText,
        errorText
      );

      return;
    }

    console.log("Discord booking notification sent successfully.");
  } catch (error) {
    console.error("Discord notification error:", error);
  }
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

    return NextResponse.json(bookings, {
      status: 200,
    });
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

    const vehicleTrim = String(
      form.get("vehicleTrim") || ""
    ).trim();

    const serviceName = String(
      form.get("selectedPackage") || "Custom Booking"
    ).trim();

    const serviceMethod = String(
      form.get("serviceMethod") || "Not specified"
    ).trim();

    const preferredDate = String(
      form.get("preferredDate") || ""
    ).trim();

    const preferredTime = String(
      form.get("preferredTime") || ""
    ).trim();

    const serviceAddress = String(
      form.get("serviceAddress") || ""
    ).trim();

    const vehicleType = String(
      form.get("vehicleType") || "Not specified"
    ).trim();

    const interiorCondition = String(
      form.get("interiorCondition") || "Not specified"
    ).trim();

    const exteriorCondition = String(
      form.get("exteriorCondition") || "Not specified"
    ).trim();

    const addOns = String(
      form.get("addOns") || "None"
    ).trim();

    const smsConsent = String(
      form.get("smsConsent") || "false"
    ).trim();

    const customerNotes = String(
      form.get("serviceNotes") || "None"
    ).trim();

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
      },
    });

    await sendDiscordNotification({
      bookingId: booking.id,
      name,
      phone,
      email,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      vehicleTrim,
      serviceName,
      serviceMethod,
      preferredDate,
      preferredTime,
      serviceAddress,
      vehicleType,
      interiorCondition,
      exteriorCondition,
      addOns,
      customerNotes,
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
        message:
          "Booking request submitted. We’ll contact you shortly.",
      },
      {
        status: 201,
      }
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
      {
        status: 400,
      }
    );
  }
}
