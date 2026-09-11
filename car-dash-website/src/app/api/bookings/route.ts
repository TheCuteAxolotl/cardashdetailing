import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePhoneNumber, sendTransactionalSms } from "@/lib/twilio-sms";
import { getAuthFromRequest } from "@/lib/auth";
import { getCurrentAccountFromRequest, isStaffAccount } from "@/lib/permissions";
import { getClientIp, hashVisitor } from "@/lib/support-security";
import { addBookingSystemMessage, getBookingChatUrl } from "@/lib/booking-chat";
import { DEFAULT_PRICING_PAGES, VEHICLE_LABELS, getPackagePrice, parsePricingConfig } from "@/lib/pricing-config";
import {
  DEFAULT_BOOKING_PRICING,
  DISCOUNT_CODES_KEY,
  STANDALONE_HEADLIGHT_SERVICE_ID,
  calculateDiscount,
  normalizeDiscountCode,
  parseBookingPricingConfig,
  parseDiscountCodes,
} from "@/lib/booking-pricing";

function required(form: FormData, key: string) {
  const value = String(form.get(key) ?? "").trim();
  if (!value) throw new Error(`Missing required field: ${key}`);
  return value;
}

function parseStringArray(value: FormDataEntryValue | null) {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

async function discordBooking(data: Record<string, string>) {
  const url = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!url) return;

  const lines = [
    "**New detailing booking**",
    `Customer: ${data.name}`,
    `Phone: ${data.phone}`,
    `Email: ${data.email}`,
    `Vehicle: ${data.vehicle}`,
    `Service: ${data.service}`,
    `Booking total: ${data.total}`,
    `Preferred: ${data.preferred}`,
    `Source: ${data.source}`,
    `Address: ${data.address || "Not specified"}`,
    `Notes: ${data.notes || "None"}`,
    "",
    `IP: ${data.ip}`,
    `Visitor hash: ${data.visitorHash}`,
  ].join("\n");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: lines.slice(0, 1950), username: "Car Dash Detailing" }),
    });
    if (!response.ok) console.error("Discord booking notification failed:", response.status, await response.text());
  } catch (error) {
    console.error("Discord booking notification failed:", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAccountFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const staff = isStaffAccount(auth);
    const bookings = await prisma.booking.findMany({
      where: staff ? {} : { userId: auth.id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const visitorHash = hashVisitor(ip);
    const blocked = await prisma.blockedVisitor.findUnique({ where: { hash: visitorHash } });
    if (blocked) return NextResponse.json({ success: false, message: "Booking requests are unavailable from this connection." }, { status: 403 });

    const recent = await prisma.booking.count({ where: { createdAt: { gte: new Date(Date.now() - 20 * 60 * 1000) } } });
    if (recent > 1000) return NextResponse.json({ success: false, message: "Please try again later." }, { status: 429 });

    const form = await request.formData();
    const name = required(form, "name");
    const phone = required(form, "phone");
    const email = required(form, "email");
    const vehicleMake = required(form, "vehicleMake");
    const vehicleModel = required(form, "vehicleModel");
    const vehicleYear = required(form, "vehicleYear");
    const policyAgreed = String(form.get("policyAgreed") || "false") === "true";
    if (!policyAgreed) return NextResponse.json({ success: false, message: "Please confirm the booking acknowledgement before submitting." }, { status: 400 });

    const vehicleTrim = String(form.get("vehicleTrim") || "").trim();
    const serviceMethod = String(form.get("serviceMethod") || "Not specified").trim();
    const preferredDate = String(form.get("preferredDate") || "").trim();
    const preferredTime = String(form.get("preferredTime") || "").trim();
    const serviceAddress = String(form.get("serviceAddress") || "").trim();
    const customerNotes = String(form.get("serviceNotes") || "None").trim();
    const smsConsent = String(form.get("smsConsent") || "false") === "true";
    if (smsConsent && !normalizePhoneNumber(phone)) return NextResponse.json({ success: false, message: "Enter a valid mobile number to receive SMS updates." }, { status: 400 });

    const serviceId = String(form.get("serviceId") || "").trim();
    const quoteThreadId = String(form.get("quoteThreadId") || "").trim();
    const pricingPage = String(form.get("pricingPage") || "").trim();
    const packageId = String(form.get("packageId") || "").trim();
    const vehicleClass = String(form.get("vehicleClass") || "").trim();
    const requestedAddOnIds = parseStringArray(form.get("addOns"));
    const discountCode = normalizeDiscountCode(String(form.get("discountCode") || ""));
    const displayedBookingTotal = Number(form.get("displayedBookingTotal"));
    const auth = getAuthFromRequest(request);

    const bookingPricingRow = await prisma.siteContent.findUnique({ where: { key: "bookingPricingConfig" } });
    const bookingPricing = parseBookingPricingConfig(bookingPricingRow?.value || JSON.stringify(DEFAULT_BOOKING_PRICING));

    let bookingName = name;
    let bookingEmail = email;
    let bookingVehicleMake = vehicleMake;
    let bookingVehicleModel = vehicleModel;
    let bookingVehicleYear = vehicleYear;
    let bookingVehicleTrim = vehicleTrim;
    let serviceName = "Custom Booking";
    let baseTotal = 0;
    let source = "Fixed-price website booking";
    let verifiedVehicleId = String(form.get("vehicleId") || "").trim() || null;
    let allowAddOns = false;

    if (quoteThreadId) {
      if (!auth?.id) return NextResponse.json({ success: false, message: "Please sign in again to book an accepted quote." }, { status: 401 });

      const quote = await prisma.quoteThread.findFirst({
        where: { id: quoteThreadId, userId: auth.id },
        include: { service: true, vehicle: true, user: { select: { name: true, email: true } } },
      });
      if (!quote) return NextResponse.json({ success: false, message: "Accepted quote not found." }, { status: 404 });
      if (quote.status !== "accepted") return NextResponse.json({ success: false, message: "This quote must be accepted before it can be booked." }, { status: 409 });
      if (!quote.quotedPrice || quote.quotedPrice <= 0) return NextResponse.json({ success: false, message: "This quote does not have a valid final price." }, { status: 409 });

      serviceName = quote.service?.title || quote.subject || "Accepted Quote";
      baseTotal = quote.quotedPrice;
      source = `Accepted specialist quote ${quote.id}`;
      bookingName = quote.user.name;
      bookingEmail = quote.user.email;
      if (quote.vehicle) {
        verifiedVehicleId = quote.vehicle.id;
        bookingVehicleYear = quote.vehicle.year;
        bookingVehicleMake = quote.vehicle.make;
        bookingVehicleModel = quote.vehicle.model;
        bookingVehicleTrim = quote.vehicle.trim || "";
      }
    } else if (pricingPage && packageId && vehicleClass) {
      if (!["packages", "exterior", "interior"].includes(pricingPage)) return NextResponse.json({ success: false, message: "That pricing page is not available." }, { status: 400 });
      const key = pricingPage === "packages" ? "pricingPackagesConfig" : pricingPage === "exterior" ? "pricingExteriorConfig" : "pricingInteriorConfig";
      const fallback = pricingPage === "packages" ? DEFAULT_PRICING_PAGES.packages : pricingPage === "exterior" ? DEFAULT_PRICING_PAGES.exterior : DEFAULT_PRICING_PAGES.interior;
      const stored = await prisma.siteContent.findUnique({ where: { key } });
      const config = parsePricingConfig(stored?.value, fallback);
      const selected = getPackagePrice(config, packageId, vehicleClass);
      if (!selected) return NextResponse.json({ success: false, message: "That package or vehicle price is no longer available. Please choose it again from the pricing page." }, { status: 409 });
      const submittedVehicleType = String(form.get("vehicleType") || "").trim();
      if (submittedVehicleType !== VEHICLE_LABELS[selected.key]) return NextResponse.json({ success: false, message: "The selected vehicle type no longer matches this package price. Please choose the package again." }, { status: 409 });

      serviceName = `${selected.pkg.name} — ${VEHICLE_LABELS[selected.key]}`;
      baseTotal = selected.price;
      source = `Fixed pricing page: ${pricingPage}/${selected.pkg.id}/${selected.key}`;
      allowAddOns = true;
    } else if (serviceId === STANDALONE_HEADLIGHT_SERVICE_ID) {
      serviceName = "Headlight Restoration";
      baseTotal = bookingPricing.headlightStandalonePrice;
      source = "Standalone Headlight Restoration";
      allowAddOns = false;
    } else {
      if (!serviceId) return NextResponse.json({ success: false, message: "Choose a service or pricing package before booking." }, { status: 400 });
      const service = await prisma.service.findUnique({ where: { id: serviceId } });
      if (!service || !service.active) return NextResponse.json({ success: false, message: "That service is not available." }, { status: 404 });
      if (service.pricingType !== "fixed" || !service.price || service.price <= 0) return NextResponse.json({ success: false, message: "This service needs an exact quote before booking. Please use Chat to a Specialist." }, { status: 409 });

      if (service.title.trim().toLowerCase() === "headlight restoration") {
        serviceName = "Headlight Restoration";
        baseTotal = bookingPricing.headlightStandalonePrice;
        source = "Standalone Headlight Restoration";
      } else {
        serviceName = service.title;
        baseTotal = service.price;
        allowAddOns = !service.category.toLowerCase().includes("marine");
      }
    }

    if (!baseTotal || baseTotal <= 0) return NextResponse.json({ success: false, message: "This booking no longer has a valid exact price." }, { status: 409 });

    if (!allowAddOns && requestedAddOnIds.length > 0) return NextResponse.json({ success: false, message: "Add-ons are not available for this booking type. Refresh the booking page and try again." }, { status: 409 });

    const activeAddOns = bookingPricing.addOns.filter((item) => item.active);
    const selectedAddOns = allowAddOns ? requestedAddOnIds.map((id) => activeAddOns.find((item) => item.id === id)).filter(Boolean) : [];
    if (allowAddOns && selectedAddOns.length !== requestedAddOnIds.length) return NextResponse.json({ success: false, message: "One of the selected add-ons changed or is no longer available. Refresh the booking page and choose the add-ons again." }, { status: 409 });

    const addOnTotal = selectedAddOns.reduce((sum, item) => sum + Number(item?.price || 0), 0);
    const subtotal = Math.round((baseTotal + addOnTotal) * 100) / 100;

    let appliedDiscount = null as ReturnType<typeof parseDiscountCodes>[number] | null;
    if (discountCode) {
      const discountRow = await prisma.siteContent.findUnique({ where: { key: DISCOUNT_CODES_KEY } });
      appliedDiscount = parseDiscountCodes(discountRow?.value).find((item) => item.active && item.code === discountCode) || null;
      if (!appliedDiscount) return NextResponse.json({ success: false, message: "That discount code is no longer valid. Remove it and try again." }, { status: 409 });
    }
    const discountAmount = calculateDiscount(subtotal, appliedDiscount);
    const bookingTotal = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

    if (Number.isFinite(displayedBookingTotal) && Math.abs(displayedBookingTotal - bookingTotal) > 0.01) {
      return NextResponse.json({ success: false, message: "The booking price changed before submission. Refresh the page to see the current total." }, { status: 409 });
    }

    if (verifiedVehicleId && auth?.id) {
      const ownedVehicle = await prisma.vehicle.findFirst({ where: { id: verifiedVehicleId, userId: auth.id }, select: { id: true } });
      if (!ownedVehicle) verifiedVehicleId = null;
    } else if (!auth?.id) {
      verifiedVehicleId = null;
    }

    const addOnSummary = selectedAddOns.length ? selectedAddOns.map((item) => `${item?.name} (+$${Number(item?.price || 0).toFixed(2)})`).join(", ") : "None";
    const details = [
      `Base service: $${baseTotal.toFixed(2)}`,
      `Add-ons: ${addOnSummary}`,
      `Add-ons total: $${addOnTotal.toFixed(2)}`,
      appliedDiscount ? `Discount: ${appliedDiscount.code} (${appliedDiscount.type === "percent" ? `${appliedDiscount.amount}%` : `$${appliedDiscount.amount.toFixed(2)}`}) -$${discountAmount.toFixed(2)}` : "Discount: None",
      `Booking total: $${bookingTotal.toFixed(2)}`,
      `Booking source: ${source}`,
      quoteThreadId ? `Quote ID: ${quoteThreadId}` : null,
      `Vehicle type: ${String(form.get("vehicleType") || "Not specified")}`,
      `Preferred time: ${preferredTime || "Not specified"}`,
      `Service address: ${serviceAddress || "Not specified"}`,
      `Interior condition: ${String(form.get("interiorCondition") || "Not specified")}`,
      `Exterior condition: ${String(form.get("exteriorCondition") || "Not specified")}`,
      `SMS consent: ${smsConsent ? "Yes" : "No"}`,
      `Customer notes: ${customerNotes}`,
    ].filter(Boolean).join("\n");

    const booking = await prisma.booking.create({
      data: {
        userId: auth?.id ?? null,
        vehicleId: verifiedVehicleId,
        serviceName,
        serviceMethod,
        customerName: bookingName,
        customerEmail: bookingEmail,
        customerPhone: phone,
        vehicleMake: bookingVehicleMake,
        vehicleModel: bookingVehicleModel,
        vehicleYear: bookingVehicleYear,
        vehicleTrim: bookingVehicleTrim,
        preferredDate,
        preferredTime: preferredTime || null,
        quotedPrice: bookingTotal,
        notes: details,
      },
    });

    const bookingChatUrl = getBookingChatUrl(booking.id, booking.customerEmail, Boolean(auth?.id));
    try {
      await addBookingSystemMessage(booking.id, `Booking request submitted for $${bookingTotal.toFixed(2)}. Use this conversation for appointment questions and updates.`);
    } catch (error) {
      console.error("Booking chat setup failed:", error);
    }

    if (quoteThreadId && auth?.id) {
      await prisma.quoteThread.update({ where: { id: quoteThreadId }, data: { status: "booked", lastCustomerSeenAt: new Date() } });
      await prisma.quoteMessage.create({ data: { threadId: quoteThreadId, sender: "team", body: `Booking request submitted for $${bookingTotal.toFixed(2)}. Appointment confirmation will appear in your account once Car Dash confirms it.` } });
    }

    await discordBooking({
      name: bookingName,
      phone,
      email: bookingEmail,
      vehicle: [bookingVehicleYear, bookingVehicleMake, bookingVehicleModel, bookingVehicleTrim].filter(Boolean).join(" "),
      service: `${serviceName}${selectedAddOns.length ? ` + ${selectedAddOns.map((item) => item?.name).join(", ")}` : ""}${appliedDiscount ? ` · code ${appliedDiscount.code}` : ""}`,
      total: `$${bookingTotal.toFixed(2)}`,
      preferred: [preferredDate, preferredTime].filter(Boolean).join(" · ") || "Not specified",
      source,
      address: serviceAddress,
      notes: customerNotes,
      ip,
      visitorHash,
    });

    if (smsConsent) {
      const requested = [preferredDate, preferredTime].filter(Boolean).join(" at ");
      await sendTransactionalSms({
        to: phone,
        body: `Car Dash Detailing: We received your booking request for ${serviceName} ($${bookingTotal.toFixed(2)})${requested ? `, requested for ${requested}` : ""}. We will notify you when it is confirmed. Message us about this booking: ${bookingChatUrl}`,
      });
    }

    return NextResponse.json({ success: true, booking, chatUrl: bookingChatUrl, message: `Booking request submitted with a total of $${bookingTotal.toFixed(2)}. Car Dash will confirm the appointment shortly.` }, { status: 201 });
  } catch (error) {
    console.error("Booking submission error:", error);
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Unable to process booking request." }, { status: 400 });
  }
}
