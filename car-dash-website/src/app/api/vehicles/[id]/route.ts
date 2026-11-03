import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest } from "@/lib/permissions";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentAccountFromRequest(request);
  if (!auth) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { id } = await context.params;
  const vehicle = await prisma.vehicle.findFirst({ where: { id, userId: auth.id }, select: { id: true } });
  if (!vehicle) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  await prisma.vehicle.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PUT(request:NextRequest,context:{params:Promise<{id:string}>}){
 const auth=await getCurrentAccountFromRequest(request);
 if(!auth)return NextResponse.json({error:"Login required"},{status:401});
 const origin=request.headers.get("origin");
 if(origin&&origin!==request.nextUrl.origin)return NextResponse.json({error:"Invalid origin"},{status:403});
 const {id}=await context.params;
 const body=await request.json().catch(()=>null);
 if(!body||typeof body!=="object")return NextResponse.json({error:"Invalid vehicle information"},{status:400});
 const string=(value:unknown,max:number)=>typeof value==="string"?value.trim().slice(0,max):"";
 const year=string(body.year,4),make=string(body.make,70),model=string(body.model,70);
 const allowed=["Sedan","Coupe","SUV","Truck","Van","Marine"];
 const vehicleType=string(body.vehicleType,20);
 if(!/^\d{4}$/.test(year)||Number(year)<1885||Number(year)>2100||!make||!model||!allowed.includes(vehicleType)){
   return NextResponse.json({error:"Enter a valid year, make, model, and vehicle category."},{status:400});
 }
 const result=await prisma.vehicle.updateMany({
   where:{id,userId:auth.id},
   data:{year,make,model,vehicleType,nickname:string(body.nickname,80)||null,
     trim:string(body.trim,80)||null,color:string(body.color,45)||null},
 });
 if(!result.count)return NextResponse.json({error:"Vehicle not found in your account"},{status:404});
 const vehicle=await prisma.vehicle.findFirst({where:{id,userId:auth.id}});
 return NextResponse.json(vehicle);
}
