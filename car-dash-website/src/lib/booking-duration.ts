import { normalizeBookingTime } from "@/lib/booking-availability";

export function timeMinutes(time:string){const n=normalizeBookingTime(time);if(!n)return null;const [h,m]=n.split(":").map(Number);return h*60+m;}
export function durationForBooking(serviceName:string,addOnNames:string[]=[],explicitMinutes?:number){
 if(Number.isFinite(explicitMinutes)&&Number(explicitMinutes)>=30)return Math.min(960,Math.ceil(Number(explicitMinutes)/15)*15);
 const name=serviceName.toLowerCase();
 let base=/full detail|signature|premium|ultimate/.test(name)?240:/essential|basic/.test(name)?150:/ceramic coating/.test(name)?480:/paint correction/.test(name)?360:/interior/.test(name)?180:/exterior/.test(name)?120:/headlight/.test(name)?90:180;
 for(const add of addOnNames){const x=add.toLowerCase();base+=/stain|shampoo|extraction|pet hair/.test(x)?60:/odor|decontam|clay|engine bay|underbody|headlight|wheel coat/.test(x)?45:30;}
 return Math.min(960,base);
}
export function savedDuration(notes:string|null|undefined,serviceName:string){
 const match=String(notes||"").match(/^Estimated duration minutes:\s*(\d+)/m);
 if(match)return durationForBooking(serviceName,[],Number(match[1]));
 const add=String(notes||"").match(/^Add-ons:\s*(.*)$/m)?.[1]||"";
 const names=add==="None"?[]:add.split(/,\s*/).map(x=>x.replace(/\s*\(\+\$.*$/,""));
 return durationForBooking(serviceName,names);
}
export function fitsWithoutOverlap(start:number,duration:number,busy:{start:number;duration:number}[],close:number){
 return start+duration<=close&&!busy.some(b=>start<b.start+b.duration&&b.start<start+duration);
}
