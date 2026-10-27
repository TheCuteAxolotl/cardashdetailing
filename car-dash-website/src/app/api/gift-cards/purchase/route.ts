import {NextRequest,NextResponse} from "next/server";
import {giftPurchase} from "@/lib/gift-card-checkout";
export async function POST(request:NextRequest){
 const headers={"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"};
 try{const body=await request.json();const token=String(body.token||"");if(!/^[a-f0-9]{64}$/.test(token))return NextResponse.json({error:"Invalid purchase link"},{status:400,headers});const purchase=await giftPurchase(token);return purchase?NextResponse.json(purchase,{headers}):NextResponse.json({error:"Purchase not found"},{status:404,headers});}catch{return NextResponse.json({error:"Could not verify payment. Wait a moment and retry. Don't pay again."},{status:503,headers});}
}
