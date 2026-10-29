import { normalizeBookingTime } from "./booking-availability";
import { savedDuration } from "./booking-duration";
import { bookingServiceAddress } from "./booking-owner-details";
export const escapeIcs=(s:string)=>s.replace(/\\/g,"\\\\").replace(/\r?\n/g,"\\n").replace(/;/g,"\\;").replace(/,/g,"\\,");
export function foldIcs(line:string) { let output="",bytes=0; for(const char of line){const n=Buffer.byteLength(char);if(bytes+n>73){output+="\r\n ";bytes=1;} output+=char;bytes+=n;}return output; }
type Item={id:string;serviceName:string;customerName:string;preferredDate:string|null;preferredTime:string|null;notes:string|null;status:string;updatedAt:Date};
export function bookingCalendar(items:Item[]) {
 const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Car Dash//Owner Schedule//EN","CALSCALE:GREGORIAN","X-WR-CALNAME:Car Dash Schedule","X-WR-TIMEZONE:America/Chicago",
 "BEGIN:VTIMEZONE","TZID:America/Chicago","BEGIN:DAYLIGHT","DTSTART:20070311T020000","RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU","TZOFFSETFROM:-0600","TZOFFSETTO:-0500","END:DAYLIGHT","BEGIN:STANDARD","DTSTART:20071104T020000","RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU","TZOFFSETFROM:-0500","TZOFFSETTO:-0600","END:STANDARD","END:VTIMEZONE"];
 for(const b of items){const time=normalizeBookingTime(b.preferredTime);if(!b.preferredDate||!time)continue;
 lines.push("BEGIN:VEVENT",`UID:booking-${b.id}@cardashdetailing.com`,`DTSTAMP:${b.updatedAt.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"")}`,`DTSTART;TZID=America/Chicago:${b.preferredDate.replace(/-/g,"")}T${time.replace(":","")}00`,`DURATION:PT${savedDuration(b.notes,b.serviceName)}M`,`SUMMARY:${escapeIcs(b.serviceName+" — "+b.customerName)}`,...(bookingServiceAddress(b.notes)?[`LOCATION:${escapeIcs(bookingServiceAddress(b.notes))}`]:[]),`STATUS:${b.status==="cancelled"?"CANCELLED":"CONFIRMED"}`,"END:VEVENT");}
 return [...lines,"END:VCALENDAR"].map(foldIcs).join("\r\n")+"\r\n";
}
