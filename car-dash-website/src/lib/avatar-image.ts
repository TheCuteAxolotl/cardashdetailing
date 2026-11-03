"use client";

/** Only the cropped, downscaled JPEG is ever saved to the account. */
const MAX_SOURCE_BYTES=20*1024*1024;
const ACCEPTED_EXTENSIONS=/\.(?:jpe?g|jfif|png|webp|gif|avif|bmp|tiff?|heic|heif)$/i;
const ACCEPTED_TYPES=new Set([
 "image/jpeg","image/pjpeg","image/jpg","image/png","image/webp","image/gif",
 "image/avif","image/bmp","image/x-ms-bmp","image/tiff","image/heic","image/heif",
 "image/heic-sequence","image/heif-sequence","application/octet-stream",
]);
function isLikelyHeic(file:File):boolean{
 return /\.(heic|heif)$/i.test(file.name)||/image\/hei[cf](?:-sequence)?/i.test(file.type);
}
async function decodeImage(file:Blob):Promise<{image:CanvasImageSource;width:number;height:number;release:()=>void}>{
 // Browser-native decoding first; handles modern formats without loading a decoder.
 if(typeof createImageBitmap==="function"){
   try{
     const bitmap=await createImageBitmap(file);
     if(bitmap.width>0&&bitmap.height>0)
       return {image:bitmap,width:bitmap.width,height:bitmap.height,release:()=>bitmap.close()};
     bitmap.close();
   }catch{/* Safari and unsupported formats can use the fallback below. */}
 }
 const url=URL.createObjectURL(file);
 try{
   const image=await new Promise<HTMLImageElement>((resolve,reject)=>{
     const el=new Image();
     el.onload=()=>resolve(el);
     el.onerror=()=>reject(new Error("Browser cannot decode this picture."));
     el.src=url;
   });
   if(!image.naturalWidth||!image.naturalHeight)throw new Error("Picture has no image data.");
   return {image,width:image.naturalWidth,height:image.naturalHeight,
     release:()=>URL.revokeObjectURL(url)};
 }catch(e){URL.revokeObjectURL(url);throw e;}
}
async function jpegData(image:CanvasImageSource,width:number,height:number):Promise<string>{
 const side=Math.min(width,height);
 const canvas=document.createElement("canvas");
 const ctx=canvas.getContext("2d");
 if(!ctx)throw new Error("Photo cropping is not available in this browser.");
 for(const size of [256,224,192]){
   canvas.width=size;canvas.height=size;
   // White background avoids black pixels in transparent PNG and WebP images.
   ctx.fillStyle="#fff";ctx.fillRect(0,0,size,size);
   ctx.drawImage(image,(width-side)/2,(height-side)/2,side,side,0,0,size,size);
   for(const quality of [.82,.70,.58,.46,.34]){
     const result=canvas.toDataURL("image/jpeg",quality);
     if(result.startsWith("data:image/jpeg;base64,")&&result.length<=150000)return result;
   }
 }
 throw new Error("The image is too detailed to save as a small profile photo.");
}
async function convertHeic(file:File):Promise<Blob>{
 // heic-to runs locally in the browser; original photo bytes aren't uploaded.
 const {heicTo,isHeic}=await import("heic-to/next");
 if(!isLikelyHeic(file)&&!(await isHeic(file)))
   throw new Error("This file isn't a supported HEIC/HEIF image.");
 return heicTo({blob:file,type:"image/jpeg",quality:.82});
}
async function prepareOnServer(file:File):Promise<string>{
 // TIFF and other less-common browser-unsupported formats get a protected fallback.
 // The server never saves the original photo; it only returns a 256px JPEG.
 if(file.size>4*1024*1024)throw new Error("This format cannot be previewed here. Choose an image under 4 MB or convert it to JPEG first.");
 const body=new FormData();body.set("photo",file);
 const response=await fetch("/api/account-profile/prepare-photo",{method:"POST",body,cache:"no-store"});
 const result=await response.json().catch(()=>({}));
 if(!response.ok||typeof result.avatar!=="string")
   throw new Error(result.error||"This image can't be converted. Try a JPEG, PNG or HEIC photo.");
 return result.avatar;
}
export async function prepareAvatar(file:File):Promise<string>{
 if(!file.size)throw new Error("This file is empty. Choose another picture.");
 if(file.size>MAX_SOURCE_BYTES)throw new Error("Choose an image smaller than 20 MB.");
 const extension=ACCEPTED_EXTENSIONS.test(file.name);
 if(!extension&&!ACCEPTED_TYPES.has(file.type.toLowerCase()))
   throw new Error("Choose a photo: JPEG, PNG, WebP, GIF, AVIF, BMP, TIFF, HEIC, or HEIF.");
 // Never accept HTML or SVG just because a filename has a recognized extension.
 if(/svg|html|xml/i.test(file.type))throw new Error("SVG and web-page files cannot be used as profile pictures.");
 let original:Blob=file;
 if(isLikelyHeic(file)){
   try{original=await convertHeic(file);}
   catch{throw new Error("This iPhone HEIC/HEIF image could not be converted. Try saving a copy as JPEG and uploading again.");}
 }
 try{
   const decoded=await decodeImage(original);
   try{
     if(Math.min(decoded.width,decoded.height)<8)
       throw new Error("This photo is too small for a profile picture.");
     return await jpegData(decoded.image,decoded.width,decoded.height);
   }finally{decoded.release();}
 }catch(e){
   if(e instanceof Error&&e.message.startsWith("This photo is too small"))throw e;
   if(original===file&&!isLikelyHeic(file)){
     // Mislabelled iPhone images sometimes have no HEIC filename or MIME.
     try{
       original=await convertHeic(file);
       const decoded=await decodeImage(original);
       try{return await jpegData(decoded.image,decoded.width,decoded.height);}
       finally{decoded.release();}
     }catch{/* Use secure server image converter for other formats. */}
   }
   return prepareOnServer(file);
 }
}
