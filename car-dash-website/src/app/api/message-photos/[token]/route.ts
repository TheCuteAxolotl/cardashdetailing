import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
export async function GET(_request:Request,{params}:{params:Promise<{token:string}>}){
 const {token}=await params;if(!/^[a-f0-9]{64}$/.test(token))return new NextResponse(null,{status:404});
 const row=await prisma.siteContent.findUnique({where:{key:`message_photo_${token}`}});if(!row)return new NextResponse(null,{status:404});
 const data=JSON.parse(row.value);if(data.expires<Date.now())return new NextResponse(null,{status:410});
 const match=data.image.match(/^data:(image\/(?:jpeg|png|webp));base64,(.*)$/);if(!match)return new NextResponse(null,{status:404});
 return new Response(Buffer.from(match[2],"base64"),{headers:{"Content-Type":match[1],"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"}});
}
