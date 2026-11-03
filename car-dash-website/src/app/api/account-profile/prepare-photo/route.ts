import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccountFromRequest } from "@/lib/permissions";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const NO_CACHE={"Cache-Control":"private, no-store"};
const FORMATS=new Set(["jpeg","png","webp","gif","avif","tiff","magick"]);

export async function POST(request:NextRequest){
 try{
   const auth=await getCurrentAccountFromRequest(request);
   if(!auth)return NextResponse.json({error:"Log in to change your profile photo."},{status:401,headers:NO_CACHE});
   const origin=request.headers.get("origin");
   if((origin&&origin!==request.nextUrl.origin)||request.headers.get("sec-fetch-site")==="cross-site")
     return NextResponse.json({error:"Invalid request origin."},{status:403,headers:NO_CACHE});
   const contentLength=Number(request.headers.get("content-length")||0);
   if(contentLength>4.3*1024*1024)return NextResponse.json({error:"Try a smaller photo, under 4 MB."},{status:413,headers:NO_CACHE});
   const form=await request.formData();
   const uploaded=form.get("photo");
   if(!(uploaded instanceof File)||uploaded.size===0||uploaded.size>4*1024*1024)
     return NextResponse.json({error:"Choose a photo under 4 MB."},{status:400,headers:NO_CACHE});
   if(/svg|html|xml|pdf/.test(uploaded.type.toLowerCase()))
     return NextResponse.json({error:"Upload an image rather than a document or SVG."},{status:400,headers:NO_CACHE});
   const bytes=Buffer.from(await uploaded.arrayBuffer());
   const head=bytes.subarray(0,256).toString("utf8").toLowerCase();
   if(head.includes("<svg")||head.includes("<!doctype")||head.includes("<html")||head.startsWith("<?xml"))
     return NextResponse.json({error:"Vector and HTML documents are not supported."},{status:400,headers:NO_CACHE});
   // sharp is already part of the installed Next.js image processing toolchain.
   const sharp=(await import("sharp")).default;
   const metadata=await sharp(bytes,{limitInputPixels:30_000_000,failOn:"error"}).metadata();
   if(!metadata.width||!metadata.height||Math.min(metadata.width,metadata.height)<8||
      !metadata.format||!FORMATS.has(metadata.format)){
     return NextResponse.json({error:"Unsupported image format. Try JPEG, PNG, AVIF, WebP, GIF or TIFF."},{status:415,headers:NO_CACHE});
   }
   let avatar="";
   for(const size of [256,224,192]){
     for(const quality of [78,62,47]){
       const result=await sharp(bytes,{limitInputPixels:30_000_000,failOn:"error"})
         .rotate().resize(size,size,{fit:"cover",position:"centre"})
         .flatten({background:"#fff"}).jpeg({quality,mozjpeg:true}).toBuffer();
       if(result.length<=110000){
         avatar="data:image/jpeg;base64,"+result.toString("base64");break;
       }
     }
     if(avatar)break;
   }
   if(!avatar)return NextResponse.json({error:"Unable to compress that photo. Try a smaller one."},{status:422,headers:NO_CACHE});
   return NextResponse.json({avatar},{headers:NO_CACHE});
 }catch(error){
   console.error("Profile photo conversion failed",error instanceof Error?error.message:"unknown");
   return NextResponse.json({error:"This photo couldn't be converted. Try a JPEG, PNG or HEIC version."},
     {status:415,headers:NO_CACHE});
 }
}
