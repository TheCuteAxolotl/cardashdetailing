import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  BOOKING_AVAILABILITY_KEY,
  formatBookingTime,
  isConfiguredBookingSlot,
  normalizeBookingTime,
  parseBookingAvailabilityConfig,
} from "@/lib/booking-availability";

import { savedDuration, timeMinutes } from "@/lib/booking-duration";
import { configuredSlotsForDate, latestStartForDate, isStartInPast } from "@/lib/booking-availability";

const ACTIVE_STATUSES = ["pending", "confirmed"];

function dateInTimeZone(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value || "";
  const month = parts.find((part) => part.type === "month")?.value || "";
  const day = parts.find((part) => part.type === "day")?.value || "";
  return `${year}-${month}-${day}`;
}

export class BookingSlotConflictError extends Error {
  constructor(message = "That booking time was just taken. Please choose another time.") {
    super(message);
    this.name = "BookingSlotConflictError";
  }
}

export class BookingSlotUnavailableError extends Error {
  constructor(message = "That date or time is not available for online booking anymore. Please choose another time.") {
    super(message);
    this.name = "BookingSlotUnavailableError";
  }
}

async function lockSlot(tx: Prisma.TransactionClient, date: string, normalizedTime: string) {
  const key = `car-dash-booking:${date}`;
  await tx.$queryRaw<Array<{ lockResult: string | null }>>`SELECT pg_advisory_xact_lock(hashtext(${key}))::text AS "lockResult"`;
}

async function slotIsTaken(tx: Prisma.TransactionClient,date:string,time:string,duration:number,excludeBookingId?:string) {
 const bookings=await tx.booking.findMany({where:{preferredDate:date,status:{in:ACTIVE_STATUSES},...(excludeBookingId?{id:{not:excludeBookingId}}:{})},select:{preferredTime:true,serviceName:true,notes:true}});
 const start=timeMinutes(time);if(start===null)return true;
 return bookings.some(b=>{const other=timeMinutes(b.preferredTime||"");return other!==null&&start<other+savedDuration(b.notes,b.serviceName)&&other<start+duration;});
}
async function slotIsPubliclyConfigured(tx:Prisma.TransactionClient,date:string,time:string,duration:number){
 const row=await tx.siteContent.findUnique({where:{key:BOOKING_AVAILABILITY_KEY}});
 const config=parseBookingAvailabilityConfig(row?.value);
 if(isStartInPast(date,time,config.timezone)||!isConfiguredBookingSlot(config,date,time))return false;
 const slots=configuredSlotsForDate(config,date);
 const latest=latestStartForDate(date);
 if(latest&&(timeMinutes(time)??9999)>timeMinutes(latest)!)return false;
 const close=latest?timeMinutes(latest)!+duration:Math.max(0,...slots.map(s=>timeMinutes(s)??0))+30;
 return (timeMinutes(time)??9999)+duration<=close;
}

export async function createBookingWithSlotProtection(
  data: Prisma.BookingUncheckedCreateInput,
  options: { enforcePublicAvailability?: boolean } = {}
) {
  const date = String(data.preferredDate || "").trim();
  const normalizedTime = normalizeBookingTime(String(data.preferredTime || ""));
  if (!date || !normalizedTime) {
    throw new BookingSlotUnavailableError("Choose an available booking date and time.");
  }

  return prisma.$transaction(async (tx) => {
    await lockSlot(tx, date, normalizedTime);

    const duration=savedDuration(String(data.notes||""),String(data.serviceName||""));
    if (options.enforcePublicAvailability && !(await slotIsPubliclyConfigured(tx, date, normalizedTime,duration))) {
      throw new BookingSlotUnavailableError();
    }

    if (await slotIsTaken(tx, date, normalizedTime,duration)) {
      throw new BookingSlotConflictError();
    }

    return tx.booking.create({
      data: {
        ...data,
        preferredDate: date,
        preferredTime: formatBookingTime(normalizedTime),
      },
    });
  });
}

export async function updateBookingScheduleWithSlotProtection(
  bookingId: string,
  date: string,
  time: string
) {
  const cleanDate = String(date || "").trim();
  const normalizedTime = normalizeBookingTime(time);
  if (!cleanDate || !normalizedTime) {
    throw new BookingSlotUnavailableError("Choose a valid date and time.");
  }

  return prisma.$transaction(async (tx) => {
    await lockSlot(tx, cleanDate, normalizedTime);
    const existing=await tx.booking.findUnique({where:{id:bookingId},select:{serviceName:true,notes:true}});
    if (await slotIsTaken(tx, cleanDate, normalizedTime,savedDuration(existing?.notes,existing?.serviceName||""), bookingId)) {
      throw new BookingSlotConflictError();
    }

    return tx.booking.update({
      where: { id: bookingId },
      data: {
        preferredDate: cleanDate,
        preferredTime: formatBookingTime(normalizedTime),
      },
    });
  });
}

export async function activateBookingStatusWithSlotProtection(
  bookingId: string,
  status: "pending" | "confirmed"
) {
  const current = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { preferredDate: true, preferredTime: true, serviceName:true,notes:true },
  });
  if (!current) return null;

  const date = String(current.preferredDate || "").trim();
  const normalizedTime = normalizeBookingTime(current.preferredTime);
  if (!date || !normalizedTime) {
    return prisma.booking.update({ where: { id: bookingId }, data: { status } });
  }

  return prisma.$transaction(async (tx) => {
    await lockSlot(tx, date, normalizedTime);
    if (await slotIsTaken(tx, date, normalizedTime,savedDuration(current.notes,current.serviceName), bookingId)) {
      throw new BookingSlotConflictError("That time is already booked by another active appointment. Move this booking before reactivating it.");
    }
    return tx.booking.update({ where: { id: bookingId }, data: { status } });
  });
}
