import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/invoices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const KEY = "owner:supplies-inventory:v1";
const CATEGORIES = new Set(["Chemicals","Equipment","Towels & pads","Consumables","Other"]);
const UNITS = new Set(["each","bottles","liters","gallons","packs","pads","towels","ounces"]);
type Entry = {
 id:string; name:string; category:string; quantity:number;
 unit:string; reorderAt:number; unitCost:number; notes:string; onOrder:number; eta:string;
};
function validate(body:unknown):Entry[]|null {
 if(!Array.isArray(body)||body.length>200)return null;
 const items:Entry[]=[];
 const ids=new Set<string>();
 for(const entry of body){
  if(!entry||typeof entry!=="object")return null;
  const x=entry as Record<string,unknown>;
  const id=String(x.id??"").slice(0,90),name=String(x.name??"").trim().slice(0,140);
  if(!/^[a-z0-9-]{6,90}$/i.test(id)||ids.has(id)||!name)return null;
  ids.add(id);
  const category=String(x.category??"Other"),unit=String(x.unit??"each");
  const quantity=Number(x.quantity),reorderAt=Number(x.reorderAt),unitCost=Number(x.unitCost),onOrder=Number(x.onOrder??0);
  const eta=String(x.eta??"");
  if(!CATEGORIES.has(category)||!UNITS.has(unit))return null;
  if(![quantity,reorderAt,unitCost,onOrder].every(v=>Number.isFinite(v)&&v>=0&&v<=1000000))return null;
  if(eta&&!/^\d{4}-\d{2}-\d{2}$/.test(eta))return null;
  items.push({id,name,category,unit,quantity:Math.round(quantity*100)/100,
   reorderAt:Math.round(reorderAt*100)/100,unitCost:Math.round(unitCost*100)/100,
   notes:String(x.notes??"").slice(0,800),onOrder:Math.round(onOrder*100)/100,eta:onOrder?eta:""});
 }
 return items;
}
export async function GET(){
 if(!(await requireOwner()))return NextResponse.json({error:"Owner access required"},{status:403});
 const row=await prisma.siteContent.findUnique({where:{key:KEY},select:{value:true,updatedAt:true}});
 if(!row)return NextResponse.json({items:[],version:null},{headers:{"Cache-Control":"private, no-store"}});
 let items:unknown;
 try{items=JSON.parse(row.value)}catch{items=[]}
 return NextResponse.json({items:validate(items)||[],version:row.updatedAt.toISOString()},
  {headers:{"Cache-Control":"private, no-store"}});
}
export async function PUT(request:NextRequest){
 if(!(await requireOwner()))return NextResponse.json({error:"Owner access required"},{status:403});
 const origin=request.headers.get("origin");
 if(origin && origin!==request.nextUrl.origin)return NextResponse.json({error:"Invalid origin"},{status:403});
 const body=await request.json().catch(()=>null);
 const items=validate(body?.items);
 if(!items)return NextResponse.json({error:"Invalid inventory data. Each item needs a name, valid quantity and unit."},{status:400});
 const version=body?.version==null?null:String(body.version);
 if(version!==null && Number.isNaN(Date.parse(version)))return NextResponse.json({error:"Invalid version"},{status:400});
 const result=await prisma.$transaction(async tx=>{
   const current=await tx.siteContent.findUnique({where:{key:KEY},select:{updatedAt:true}});
   if((current?.updatedAt.toISOString()||null)!==version)return {conflict:true};
   if(!current){
     const created=await tx.siteContent.create({data:{key:KEY,value:JSON.stringify(items)}});
     return {version:created.updatedAt.toISOString()};
   }
   const updated=await tx.siteContent.update({
     where:{key:KEY},data:{value:JSON.stringify(items)},
   });
   return {version:updated.updatedAt.toISOString()};
 }).catch(error=>{console.error("Inventory save failed",error);return {error:true}});
 if("conflict" in result)return NextResponse.json({error:"Inventory changed in another tab. Refresh before saving."},{status:409});
 if("error" in result)return NextResponse.json({error:"Could not save inventory. Try again."},{status:500});
 return NextResponse.json({ok:true,version:result.version});
}
