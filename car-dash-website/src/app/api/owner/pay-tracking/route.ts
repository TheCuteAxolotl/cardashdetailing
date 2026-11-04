import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest,isOwnerAccount } from "@/lib/permissions";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const KEY="owner:staff-pay-tracking:v1";
const noStore={"Cache-Control":"private, no-store"};
type Entry={
 id:string;name:string;periodStart:string;periodEnd:string;hourlyRate:number;regularHours:number;
 overtimeHours:number;commission:number;adjustments:number;notes:string;reviewed:boolean;
};
function normalize(input:unknown):Entry[]|null{
 if(!Array.isArray(input)||input.length>200)return null;
 const rows:Entry[]=[];const seen=new Set<string>();
 for(const item of input){
   if(!item||typeof item!=="object"||Array.isArray(item))return null;
   const e=item as Record<string,unknown>;
   const id=String(e.id||"");const name=String(e.name||"").trim().slice(0,120);
   const periodStart=String(e.periodStart||"");const periodEnd=String(e.periodEnd||"");
   if(!/^[a-z0-9_-]{6,90}$/i.test(id)||seen.has(id)||!name||
     !/^\d{4}-\d{2}-\d{2}$/.test(periodStart)||!/^\d{4}-\d{2}-\d{2}$/.test(periodEnd)||periodStart>periodEnd)return null;
   seen.add(id);
   const numeric=(key:string)=>Number(e[key]??0);
   const hourlyRate=numeric("hourlyRate"),regularHours=numeric("regularHours"),
     overtimeHours=numeric("overtimeHours"),commission=numeric("commission"),adjustments=numeric("adjustments");
   if(![hourlyRate,regularHours,overtimeHours,commission,adjustments].every(Number.isFinite)
     ||hourlyRate<0||hourlyRate>1000||regularHours<0||regularHours>744
     ||overtimeHours<0||overtimeHours>744||commission<0||commission>1000000||Math.abs(adjustments)>1000000)return null;
   rows.push({id,name,periodStart,periodEnd,hourlyRate,regularHours,overtimeHours,
     commission,adjustments,notes:String(e.notes||"").slice(0,600),reviewed:e.reviewed===true});
 }
 return rows;
}
async function authorized(request:NextRequest){return isOwnerAccount(await getCurrentAccountFromRequest(request));}
export async function GET(request:NextRequest){
 if(!(await authorized(request)))return NextResponse.json({error:"Owner access required"},{status:403,headers:noStore});
 try{
   const row=await prisma.siteContent.findUnique({where:{key:KEY},select:{value:true,updatedAt:true}});
   let decoded:unknown=[];
   try{decoded=JSON.parse(row?.value||"[]");}catch{}
   return NextResponse.json({entries:normalize(decoded)||[],version:row?.updatedAt.toISOString()||null},
     {headers:noStore});
 }catch{return NextResponse.json({error:"Unable to load pay tracking."},{status:500,headers:noStore});}
}
export async function PUT(request:NextRequest){
 if(!(await authorized(request)))return NextResponse.json({error:"Owner access required"},{status:403,headers:noStore});
 const origin=request.headers.get("origin");
 if(origin&&origin!==request.nextUrl.origin||request.headers.get("sec-fetch-site")==="cross-site")
   return NextResponse.json({error:"Invalid request origin"},{status:403,headers:noStore});
 const body=await request.json().catch(()=>null);
 const entries=normalize(body?.entries);
 if(!entries)return NextResponse.json({error:"Review employee name, pay dates, and numeric hours/rates."},{status:400,headers:noStore});
 const version=body?.version===null?null:String(body?.version||"");
 try{
   const result=await prisma.$transaction(async tx=>{
     const row=await tx.siteContent.findUnique({where:{key:KEY},select:{updatedAt:true}});
     if((row?.updatedAt.toISOString()||null)!==version)return {conflict:true};
     const saved=await tx.siteContent.upsert({
       where:{key:KEY},update:{value:JSON.stringify(entries)},
       create:{key:KEY,value:JSON.stringify(entries)},
     });
     return {version:saved.updatedAt.toISOString()};
   });
   if("conflict" in result)return NextResponse.json({error:"Pay worksheet changed in another tab. Reload before saving."},{status:409,headers:noStore});
   return NextResponse.json({ok:true,version:result.version},{headers:noStore});
 }catch(e){console.error("Pay tracking save failed",e);return NextResponse.json({error:"Could not save pay worksheet."},{status:500,headers:noStore});}
}
