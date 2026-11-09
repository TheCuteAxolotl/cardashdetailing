export type CashPayment = { month: string; received: string; cents: number; staffId: string };
export type ServiceSchedule = { ordinal: number; weekday: number; startMonth: string; phone: string; lead: number; enabledAt: string };
export type CashPlan = { schedule?: ServiceSchedule; id: string; customer: string; cents: number; firstDue: string; ended: boolean; payments: CashPayment[] };
export function nextCashDue(plan: CashPlan) {
  const [year, month, day] = plan.firstDue.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1 + plan.payments.length, 1));
  const lastDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
  next.setUTCDate(Math.min(day, lastDay));
  const due = next.toISOString().slice(0, 10);
  return plan.schedule && due.slice(0,7)>=plan.schedule.startMonth ? serviceInMonth(due.slice(0,7),plan.schedule.ordinal,plan.schedule.weekday) : due;
}
export const chicagoDay = () => new Intl.DateTimeFormat("en-CA", {timeZone:"America/Chicago",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());

export const weekdays=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
export const ordinals=["First","Second","Third","Fourth","Last"];
export function serviceInMonth(month:string, ordinal:number, weekday:number) {
  const [y,m]=month.split("-").map(Number);
  const date=new Date(Date.UTC(y,m-1,1));
  if(ordinal===5){
    date.setUTCMonth(date.getUTCMonth()+1,0);
    date.setUTCDate(date.getUTCDate()-(date.getUTCDay()-weekday+7)%7);
  }else date.setUTCDate(1+(weekday-date.getUTCDay()+7)%7+7*(ordinal-1));
  return date.toISOString().slice(0,10);
}
export function nextService(s:Pick<ServiceSchedule,"startMonth"|"ordinal"|"weekday">, today:string){
  const month=s.startMonth>today.slice(0,7)?s.startMonth:today.slice(0,7);
  const date=serviceInMonth(month,s.ordinal,s.weekday);
  if(date>=today)return date;
  const next=new Date(month+"-01T12:00:00Z");next.setUTCMonth(next.getUTCMonth()+1);
  return serviceInMonth(next.toISOString().slice(0,7),s.ordinal,s.weekday);
}
export function prettyDay(date:string){return new Date(date+"T12:00:00Z").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric",timeZone:"UTC"})}
