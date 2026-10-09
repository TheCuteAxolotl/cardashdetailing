import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest } from "@/lib/permissions";
import { PROMOTION_COSTS_KEY, parseCosts, estimateCosts } from "@/lib/promotion-costs";
import { PROMOTIONS_KEY, parsePromotions } from "@/lib/promotions";

function extract(notes: string | null, label: string) {
  const prefix=label+": ";
  return (notes||"").split("\n").find(line=>line.startsWith(prefix))?.slice(prefix.length).trim() || "";
}
function money(input:string){const n=Number(input.replace(/[^0-9.]/g,""));return Number.isFinite(n)?n:0;}
export async function GET(request:NextRequest) {
  try {
    const auth=await getCurrentAccountFromRequest(request);
    if(auth?.role!=="owner")return NextResponse.json({error:"Owner access required"},{status:403});
    const range=request.nextUrl.searchParams.get("range")||"30";
    const days=["7","30","90","365"].includes(range)?Number(range):30;
    const since=new Date(Date.now()-days*86400000);
    const [bookings,configRow,costRow]=await Promise.all([
      prisma.booking.findMany({where:{createdAt:{gte:since}},select:{id:true,createdAt:true,status:true,quotedPrice:true,notes:true},orderBy:{createdAt:"desc"},take:5000}),
      prisma.siteContent.findUnique({where:{key:PROMOTIONS_KEY}}),
      prisma.siteContent.findUnique({where:{key:PROMOTION_COSTS_KEY}})
    ]);
    const campaigns=parsePromotions(configRow?.value).promotions;
    const costs=parseCosts(costRow?.value);
    let estimatedCompletedCosts=0;
    const groups=new Map<string,{id:string;title:string;bookings:number;bookingValue:number;savings:number;completedBookings:number;completedBookingValue:number;estimatedCosts:number}>();
    const get=(id:string)=>{if(!groups.has(id))groups.set(id,{id,title:campaigns.find(p=>p.id===id)?.title|| (id==="legacy"?"Unattributed promotion":id==="add-on-promotion"?"Add-on promotion":id),bookings:0,bookingValue:0,savings:0,completedBookings:0,completedBookingValue:0,estimatedCosts:0});return groups.get(id)!;};
    let discountedBookings=0, totalSavings=0, discountedBookingValue=0, completedDiscountedBookings=0, completedDiscountedValue=0;
    for(const booking of bookings){
      const savings=money(extract(booking.notes,"Automatic promotion savings"));
      if(savings<=0)continue;
      const id=extract(booking.notes,"Automatic promotion campaign")||"legacy";
      const record=get(id);
      const value=Math.max(0,Number(booking.quotedPrice)||0);
      const status=String(booking.status||"").toLowerCase();
      const completed=status==="completed"||status==="complete";
      record.bookings++;record.bookingValue+=value;record.savings+=savings;
      if(completed){const jobCost=estimateCosts(value,costs);record.completedBookings++;record.completedBookingValue+=value;record.estimatedCosts+=jobCost;estimatedCompletedCosts+=jobCost;completedDiscountedBookings++;completedDiscountedValue+=value;}
      discountedBookings++;totalSavings+=savings;discountedBookingValue+=value;
    }
    return NextResponse.json({
      rangeDays:days,scannedBookings:bookings.length,limited:bookings.length===5000,
      costsConfigured:!!costRow,estimatedCompletedCosts:Math.round(estimatedCompletedCosts*100)/100,estimatedCompletedContribution:Math.round((completedDiscountedValue-estimatedCompletedCosts)*100)/100,
      discountedBookings,discountedBookingValue:Math.round(discountedBookingValue*100)/100,
      totalSavings:Math.round(totalSavings*100)/100,
      completedDiscountedBookings,completedDiscountedValue:Math.round(completedDiscountedValue*100)/100,
      campaigns:[...groups.values()].map(g=>({...g,bookingValue:Math.round(g.bookingValue*100)/100,savings:Math.round(g.savings*100)/100,completedBookingValue:Math.round(g.completedBookingValue*100)/100,estimatedCosts:Math.round(g.estimatedCosts*100)/100,estimatedContribution:Math.round((g.completedBookingValue-g.estimatedCosts)*100)/100})).sort((a,b)=>b.bookingValue-a.bookingValue)
    });
  } catch(e){console.error("Promotion analytics failed",e);return NextResponse.json({error:"Could not load promotion analytics"},{status:500});}
}
