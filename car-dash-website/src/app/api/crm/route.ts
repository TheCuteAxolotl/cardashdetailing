import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest, isOwnerAccount } from "@/lib/permissions";
import { ensureGuestQuoteSupport } from "@/lib/quote-guest";
import { listInvoices, calculateInvoiceTotals } from "@/lib/invoices";
import { extractBookingPhotos } from "@/lib/booking-photos";
import { normalizePhoneNumber } from "@/lib/twilio-sms";
async function setup() {
 await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "CrmProfile" ("id" TEXT PRIMARY KEY, "data" JSONB NOT NULL, "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
}
export async function GET(req: NextRequest) {
 if (!isOwnerAccount(await getCurrentAccountFromRequest(req))) return NextResponse.json({error:"Owner access required"},{status:403});
 try {
 await setup(); await ensureGuestQuoteSupport();
 const [bookings,quotes,profiles,invoices,vehicles] = await Promise.all([
 prisma.booking.findMany({orderBy:{createdAt:"desc"}}),
 prisma.quoteThread.findMany({include:{user:{select:{name:true,email:true}},messages:{where:{sender:"system",body:{startsWith:"Service address: "}},take:1}},orderBy:{createdAt:"desc"}}),
 prisma.$queryRaw<Array<{id:string;data:Record<string,string>}>>`SELECT "id","data" FROM "CrmProfile"`,
 listInvoices(),
 prisma.vehicle.findMany({include:{user:{select:{email:true}}}})
 ]);
 type Customer = {id:string;name:string;email:string;phone:string;address:string;bookings:typeof bookings;quotes:typeof quotes;profile:Record<string,string>};
 const map=new Map<string,Customer>();
 const get=(email:string,phone:string,fallback:string,name:string) => {
 const id=email.trim()? "email:"+email.trim().toLowerCase():phone.replace(/\D/g,"")?"phone:"+phone.replace(/\D/g,""):fallback;
 let c=map.get(id);if(!c){c={id,name,email,phone,address:"",bookings:[],quotes:[],profile:{}};map.set(id,c);}
 if(!c.phone)c.phone=phone;return c;
 };
 for(const b of bookings){const c=get(b.customerEmail,b.customerPhone,"booking:"+b.id,b.customerName);c.bookings.push(b);if(!c.address)c.address=b.notes?.match(/^Service address: (.+)$/m)?.[1]||"";}
 for(const q of quotes){const c=get(q.user?.email||q.guestEmail||"",q.guestPhone||"","quote:"+q.id,q.user?.name||q.guestName||"Customer");c.quotes.push(q);if(!c.address)c.address=q.messages[0]?.body.slice(17)||"";}
 for(const p of profiles){let c=map.get(p.id);if(!c){c={id:p.id,name:p.data.name||"New lead",email:p.data.email||"",phone:p.data.phone||"",address:"",bookings:[],quotes:[],profile:{}};map.set(p.id,c);}c.profile=p.data;}
 const customers=[...map.values()].map(c=>{
 const email=(c.profile.email||c.email).trim().toLowerCase();
 const phone=normalizePhoneNumber(c.profile.phone||c.phone);
 const matches=invoices.filter(i=>{
 const ie=(i.customerEmail||"").trim().toLowerCase();
 if(email&&ie)return email===ie;
 if(!phone||normalizePhoneNumber(i.customerPhone)!==phone)return false;
 return [...map.values()].filter(other=>normalizePhoneNumber(other.profile.phone||other.phone)===phone).length===1;
 }).map(i=>({id:i.id,invoiceNumber:i.invoiceNumber,status:i.status,dueDate:i.dueDate,updatedAt:i.updatedAt,totals:calculateInvoiceTotals(i)}));
 return {...c,invoices:matches,vehicles:vehicles.filter(v=>email&&v.user.email.trim().toLowerCase()===email).map(({user,...v})=>v),bookings:c.bookings.map(b=>({...b,photos:extractBookingPhotos(b.notes)}))};
 });
 return NextResponse.json({customers,asOf:new Date().toISOString()},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){console.error("CRM read failed",e);return NextResponse.json({error:"Could not load CRM. Please retry."},{status:500});}
}
export async function POST(req:NextRequest){
 if(!isOwnerAccount(await getCurrentAccountFromRequest(req)))return NextResponse.json({error:"Owner access required"},{status:403});
 if(req.headers.get("sec-fetch-site")==="cross-site" || (req.headers.get("origin") && req.headers.get("origin")!==req.nextUrl.origin))return NextResponse.json({error:"Invalid origin"},{status:403});
 try{
 const b=await req.json();const id=String(b.id||"").slice(0,320);
 if(!id)return NextResponse.json({error:"Customer ID required"},{status:400});
 const data:Record<string,string>={};
 for(const key of ["name","email","phone","address","stage","tags","notes","followUp","source","nextAction","vehicleNotes"])data[key]=String(b[key]||"").trim().slice(0,key==="notes"?10000:500);
 if(!data.name)return NextResponse.json({error:"Customer name required"},{status:400});
 if(!["Lead","Contacted","Quoted","Customer","Inactive"].includes(data.stage))return NextResponse.json({error:"Invalid stage"},{status:400});
 if(data.followUp && !/^\d{4}-\d{2}-\d{2}$/.test(data.followUp))return NextResponse.json({error:"Invalid follow-up date"},{status:400});
 await setup();const json=JSON.stringify(data);
 await prisma.$executeRaw`INSERT INTO "CrmProfile" ("id","data") VALUES (${id},${json}::jsonb) ON CONFLICT ("id") DO UPDATE SET "data"=EXCLUDED."data","updatedAt"=NOW()`;
 return NextResponse.json({success:true});
 }catch(e){console.error("CRM save failed",e);return NextResponse.json({error:"Could not save customer"},{status:500});}
}
