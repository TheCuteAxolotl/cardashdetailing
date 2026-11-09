export type CashPayment = { month: string; received: string; cents: number; staffId: string };
export type CashPlan = { id: string; customer: string; cents: number; firstDue: string; ended: boolean; payments: CashPayment[] };
export function nextCashDue(plan: CashPlan) {
  const [year, month, day] = plan.firstDue.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1 + plan.payments.length, 1));
  const lastDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
  next.setUTCDate(Math.min(day, lastDay));
  return next.toISOString().slice(0, 10);
}
export const chicagoDay = () => new Intl.DateTimeFormat("en-CA", {timeZone:"America/Chicago",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
