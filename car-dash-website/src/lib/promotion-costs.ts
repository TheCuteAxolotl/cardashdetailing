export const PROMOTION_COSTS_KEY="promotionCostAssumptions";
export type CostAssumptions={laborHourlyRate:number;laborHoursPerBooking:number;suppliesPercent:number;travelCostPerBooking:number;otherCostPerBooking:number};
export const DEFAULT_COSTS:CostAssumptions={laborHourlyRate:0,laborHoursPerBooking:0,suppliesPercent:0,travelCostPerBooking:0,otherCostPerBooking:0};
export function parseCosts(raw:string|null|undefined):CostAssumptions{
  try{
    const value=JSON.parse(raw||"{}");
    const n=(key:keyof CostAssumptions,max:number)=>{const x=Number(value[key]);return Number.isFinite(x)&&x>=0?Math.min(x,max):0};
    return {laborHourlyRate:n("laborHourlyRate",500),laborHoursPerBooking:n("laborHoursPerBooking",72),suppliesPercent:n("suppliesPercent",100),travelCostPerBooking:n("travelCostPerBooking",10000),otherCostPerBooking:n("otherCostPerBooking",10000)};
  }catch{return DEFAULT_COSTS;}
}
export function estimateCosts(value:number,costs:CostAssumptions){
  return Math.round((costs.laborHourlyRate*costs.laborHoursPerBooking+value*costs.suppliesPercent/100+costs.travelCostPerBooking+costs.otherCostPerBooking)*100)/100;
}
