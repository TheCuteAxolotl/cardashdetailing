import { conversionPrice, conversionDuration } from "@/lib/conversion-input";
import { recommendedServiceMinutes } from "@/lib/booking-duration";
import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getCurrentAccountFromRequest,hasStaffPermission} from "@/lib/permissions";
import {isDateString,normalizeBookingTime} from "@/lib/booking-availability";
import {createBookingWithSlotProtection,BookingSlotConflictError,BookingSlotUnavailableError} from "@/lib/booking-slot";
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const auth=await getCurrentAccountFromRequest(request);
 if(!hasStaffPermission(auth,"bookings")||!hasStaffPermission(auth,"quoteChats"))return NextResponse.json({error:"Quote and booking access required"},{status:403});
 if(request.headers.get('sec-fetch-site')==='cross-site'||(request.headers.get('origin')&&request.headers.get('origin')!==request.nextUrl.origin))return NextResponse.json({error:'Invalid origin'},{status:403});
 try{
 const {id}=await params;const quote=await prisma.quoteThread.findUnique({where:{id}});
 if(!quote)return NextResponse.json({error:"Quote not found"},{status:404});
 const b=await request.json();const clean=(key:string,max=240)=>String(b[key]??"").trim().slice(0,max);
 const date=clean('preferredDate'),time=clean('preferredTime');const price=conversionPrice(b.quotedPrice);
 const duration=b.durationMinutes===undefined?recommendedServiceMinutes(null,clean('serviceName')):conversionDuration(b.durationMinutes);
 if(!clean('customerName')||!clean('serviceName')||!isDateString(date)||!normalizeBookingTime(time)||price===null||duration===null)return NextResponse.json({error:"Enter customer name, service, a valid price, duration (30–960 minutes), date and time."},{status:400});
 const booking=await createBookingWithSlotProtection({userId:quote.userId,vehicleId:quote.vehicleId,serviceName:clean('serviceName'),serviceMethod:'mobile',customerName:clean('customerName'),customerEmail:clean('customerEmail'),customerPhone:clean('customerPhone'),vehicleMake:clean('vehicleMake')||'Not specified',vehicleModel:clean('vehicleModel')||'Not specified',vehicleYear:clean('vehicleYear')||'Not specified',vehicleTrim:clean('vehicleTrim')||null,preferredDate:date,preferredTime:time,quotedPrice:price,status:'confirmed',notes:[`Estimated duration minutes: ${duration}`,`Quote ID: ${id}`,`Original vehicle: ${quote.guestVehicle||''}`,quote.quoteNotes?`Quote notes: ${quote.quoteNotes}`:'',clean('notes',2000)?`Owner notes: ${clean('notes',2000)}`:''].filter(Boolean).join('\n')},{quoteThreadId:id,expectedQuoteUpdatedAt:quote.updatedAt});
 return NextResponse.json({booking},{status:201});
 }catch(error){if(error instanceof BookingSlotConflictError||error instanceof BookingSlotUnavailableError)return NextResponse.json({error:error.message},{status:409});console.error('Quote conversion failed',error);return NextResponse.json({error:'Could not create booking. Please retry.'},{status:500});}
}
