import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccountFromRequest } from "@/lib/permissions";
import { decodeStoredProfile, normalizeAccountProfile } from "@/lib/account-profile";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const keyFor=(id:string)=>"private_account_profile_v1:"+id;
const headers={"Cache-Control":"private, no-store"};

export async function GET(request:NextRequest){
  try{
    const auth=await getCurrentAccountFromRequest(request);
    if(!auth)return NextResponse.json({error:"Login required"},{status:401,headers});
    const [user,stored,vehicles]=await Promise.all([
      prisma.user.findUnique({where:{id:auth.id},select:{id:true,name:true,email:true,role:true}}),
      prisma.siteContent.findUnique({where:{key:keyFor(auth.id)},select:{value:true}}),
      prisma.vehicle.findMany({where:{userId:auth.id},orderBy:{createdAt:"desc"},take:60}),
    ]);
    if(!user)return NextResponse.json({error:"Account not found"},{status:404,headers});
    return NextResponse.json({user,profile:decodeStoredProfile(stored?.value),vehicles},{headers});
  }catch(e){
    console.error("Private account profile read failed",e);
    return NextResponse.json({error:"Unable to load your saved profile."},{status:500,headers});
  }
}
export async function PUT(request:NextRequest){
  try{
    const auth=await getCurrentAccountFromRequest(request);
    if(!auth)return NextResponse.json({error:"Login required"},{status:401,headers});
    const origin=request.headers.get("origin");
    if(origin && origin!==request.nextUrl.origin)return NextResponse.json({error:"Invalid origin"},{status:403,headers});
    const body=await request.json().catch(()=>null);
    if(!body||typeof body!=="object"||Array.isArray(body)){
      return NextResponse.json({error:"Invalid profile data"},{status:400,headers});
    }
    const name=typeof body.name==="string"?body.name.trim():"";
    if(name.length<2||name.length>100)return NextResponse.json({error:"Enter a name from 2 to 100 characters."},{status:400,headers});
    const profile=normalizeAccountProfile(body.profile);
    if(!profile)return NextResponse.json({error:"Check your phone, photo size, and required address fields."},{status:400,headers});
    if(profile.avatar){
      const base64=profile.avatar.slice("data:image/jpeg;base64,".length);
      const image=Buffer.from(base64,"base64");
      if(image.length>115000||image.length<100||image[0]!==0xff||image[1]!==0xd8||image[2]!==0xff)
        return NextResponse.json({error:"Profile photos must be valid compressed JPEGs under 115 KB."},{status:400,headers});
    }
    const updated=await prisma.$transaction(async tx=>{
      const user=await tx.user.update({
        where:{id:auth.id},data:{name},select:{id:true,name:true,email:true,role:true},
      });
      await tx.siteContent.upsert({
        where:{key:keyFor(auth.id)},
        update:{value:JSON.stringify(profile)},
        create:{key:keyFor(auth.id),value:JSON.stringify(profile)},
      });
      return user;
    });
    return NextResponse.json({ok:true,user:updated,profile},{headers});
  }catch(e){
    console.error("Private account profile save failed",e);
    return NextResponse.json({error:"Unable to save your profile. Try again."},{status:500,headers});
  }
}
