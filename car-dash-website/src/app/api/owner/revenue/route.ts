import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccountFromRequest, isOwnerAccount } from "@/lib/permissions";
import { listInvoices } from "@/lib/invoices";
import { revenueForMonth } from "@/lib/revenue-by-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store"};
function chicagoMonth(){
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Chicago",year:"numeric",month:"2-digit"}).formatToParts(new Date());
 const p=(type:string)=>parts.find(part=>part.type===type)?.value||"";
 return p("year")+"-"+p("month");
}
function previousMonth(month:string){
 const [y,m]=month.split("-").map(Number);
 return new Date(Date.UTC(y,m-2,1)).toISOString().slice(0,7);
}
export async function GET(request:NextRequest){
 const auth=await getCurrentAccountFromRequest(request);
 if(!isOwnerAccount(auth))return NextResponse.json({error:"Owner access required"},{status:403,headers:noStore});
 const month=request.nextUrl.searchParams.get("month")||chicagoMonth();
 if(!/^(20|19)\d{2}-(0[1-9]|1[0-2])$/.test(month))return NextResponse.json({error:"Invalid reporting month"},{status:400,headers:noStore});
 try{
   const invoices=await listInvoices();
   const current=revenueForMonth(invoices,month);
   const previous=revenueForMonth(invoices,previousMonth(month));
   return NextResponse.json({current,previous:previous.total,source:"Recorded payments on non-draft, non-void invoices"},
     {headers:noStore});
 }catch(error){
   console.error("CRM service revenue report failed",error);
   return NextResponse.json({error:"Unable to load payment records."},{status:500,headers:noStore});
 }
}
