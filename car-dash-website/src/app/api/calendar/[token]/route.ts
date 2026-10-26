import { createHash, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { bookingCalendar } from "@/lib/calendar-feed";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{token:string}>}) {
 const {token}=await params;
 if(!/^[a-f0-9]{64}$/.test(token)) return new Response("Not found",{status:404});
 const stored=await prisma.siteContent.findUnique({where:{key:"owner_calendar_token_hash"}});
 const hash=createHash("sha256").update(token).digest("hex");
 if(!stored||stored.value.length!==64||!timingSafeEqual(Buffer.from(hash),Buffer.from(stored.value))) return new Response("Not found",{status:404});
 const bookings=await prisma.booking.findMany({where:{status:{in:["confirmed","completed","cancelled"]}}});
 return new Response(bookingCalendar(bookings),{headers:{"Content-Type":"text/calendar; charset=utf-8","Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"}});
}
