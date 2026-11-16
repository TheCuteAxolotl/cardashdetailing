import {prisma} from "@/lib/prisma";
import {chicagoDay,nextService,serviceInMonth,type CashPlan} from "@/lib/cash-maintenance";

// A stable ID ties one real booking to each plan and billing month.
export async function syncPlanBookings(id:string, changed=false){
  const key="owner:cash-maintenance:"+id;
  await prisma.$transaction(async tx=>{
    const rows=await tx.$queryRaw<{value:string}[]>`SELECT value FROM "SiteContent" WHERE key=${key} FOR UPDATE`;
    if(!rows.length)return;
    const plan:CashPlan=JSON.parse(rows[0].value), s=plan.schedule;
    if(!s)return;
    const prefix="monthly-"+id+"-",today=chicagoDay();
    const open={id:{startsWith:prefix},preferredDate:{gte:today},status:{in:["confirmed","pending"]}};
    if(plan.pausedAt && !plan.ended){
      const held=await tx.booking.findMany({where:open,select:{id:true}});
      if(held.length){
        plan.pausedBookings=[...new Set([...(plan.pausedBookings||[]),...held.map(b=>b.id)])];
        await tx.siteContent.update({where:{key},data:{value:JSON.stringify(plan)}});
        await tx.booking.updateMany({where:open,data:{status:"cancelled"}});
      }
      return;
    }
    if(plan.ended){await tx.booking.updateMany({where:open,data:{status:"cancelled"}});return}
    const first=nextService(s,today),cursor=new Date(first.slice(0,7)+"-01T12:00:00Z");
    const ids:string[]=[];
    for(let i=0;i<3;i++,cursor.setUTCMonth(cursor.getUTCMonth()+1)){
      const month=cursor.toISOString().slice(0,7),bookingId=prefix+month;
      if(plan.skipped?.includes(month)){
        await tx.booking.updateMany({where:{...open,id:bookingId},data:{status:"cancelled"}});
        continue;
      }
      ids.push(bookingId);
      const fields={userId:plan.userId,vehicleId:plan.vehicleId,preferredTime:s.time,notes:[s.address,s.notes].filter(Boolean).join("\\n")||undefined,customerName:plan.customer,customerPhone:s.phone,serviceName:"Monthly plan · Maintenance detail",serviceMethod:"mobile",vehicleYear:s.year||"",vehicleMake:s.make||"",vehicleModel:s.model||"",preferredDate:serviceInMonth(month,s.ordinal,s.weekday),quotedPrice:plan.cents/100};
      await tx.booking.upsert({where:{id:bookingId},create:{...fields,id:bookingId,customerEmail:"",status:"confirmed"},update:{}});
      if(plan.pausedBookings?.includes(bookingId))await tx.booking.updateMany({where:{id:bookingId,status:"cancelled"},data:{...fields,status:"confirmed"}});
      if(changed)await tx.booking.updateMany({where:{id:bookingId,status:{in:["confirmed","pending"]},preferredDate:{gte:today}},data:fields});
    }
    if(plan.pausedBookings?.length){delete plan.pausedBookings;await tx.siteContent.update({where:{key},data:{value:JSON.stringify(plan)}})}
    if(changed)await tx.booking.updateMany({where:{...open,id:{startsWith:prefix,notIn:ids}},data:{status:"cancelled"}});
  });
}