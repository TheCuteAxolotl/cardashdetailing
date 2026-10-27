import {randomBytes} from "node:crypto";
import {prisma} from "@/lib/prisma";
import {getPublicSiteUrl} from "@/lib/twilio-sms";
export function messagePhotos(value:unknown):string[]{
 if(value==null)return [];
 if(!Array.isArray(value)||value.length>3||value.some(x=>typeof x!=="string"||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(x)||x.length>650000))throw new Error("Attach up to 3 JPG, PNG or WebP photos under 475 KB each.");
 return value;
}
export async function mmsPhotoUrls(photos:string[]){
 return Promise.all(photos.map(async value=>{const token=randomBytes(32).toString("hex");await prisma.siteContent.create({data:{key:`message_photo_${token}`,value:JSON.stringify({image:value,expires:Date.now()+7*86400000})}});return `${getPublicSiteUrl()}/api/message-photos/${token}`;}));
}
