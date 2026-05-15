import { NextResponse } from "next/server";
import Twilio from "twilio";

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

export async function POST(request: Request) {
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
    const imageFiles = formData.getAll("images").filter((value) => value instanceof File) as File[];

    const imageList = imageFiles.map((file) => file.name).join(", ");
    const messageBody = `New booking request from ${name}\nPhone: ${phone}\nEmail: ${email}\nVehicle: ${vehicleYear} ${vehicleMake} ${vehicleModel} ${vehicleTrim ? `(${vehicleTrim})` : ""}\nPreferred: ${preferredDate}\nNotes: ${serviceNotes || "None"}\nImages: ${imageFiles.length} attached${imageFiles.length ? ` (${imageList})` : ""}`;

    const sent = await sendSmsNotification(messageBody);

    return NextResponse.json({
      success: true,
      message: sent
        ? "Booking request sent. We’ll be in touch soon."
        : "Booking request received. SMS notifications are not configured yet, but the request is logged.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to process booking request.",
    }, { status: 400 });
  }
}
