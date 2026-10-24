export type LoyaltyEvent = {
  id: string; type: "opening" | "visit" | "redeem" | "void";
  credits: number; date: string; service: string; reference: string; notes: string;
  targetId?: string; recordedAt: string; actor: string;
};
export type LoyaltyCard = {
  id: string; vin: string; customer: string; phone: string; vehicle: string;
  version: number; createdAt: string; events: LoyaltyEvent[];
};
export function loyaltyTotals(card: LoyaltyCard) {
  const voided = new Set(card.events.filter(e => e.type === "void").map(e => e.targetId));
  const active = card.events.filter(e => e.type !== "void" && !voided.has(e.id));
  const earned = active.filter(e => e.type !== "redeem").reduce((sum, e) => sum + e.credits, 0);
  const redeemed = active.filter(e => e.type === "redeem").length;
  const balance = earned - redeemed * 4;
  return { earned, redeemed, balance, rewards: Math.floor(balance / 4), progress: balance % 4 };
}
export function appendLoyaltyEvent(card: LoyaltyCard, event: LoyaltyEvent): LoyaltyCard {
  if (card.events.some(e => e.id === event.id)) return card;
  if (event.type === "opening") throw new Error("Opening visits can only be recorded when creating the card.");
  if (event.type === "visit" && event.credits !== 1) throw new Error("Each paid detail earns one visit.");
  if (event.type === "redeem" && loyaltyTotals(card).balance < 4) throw new Error("Four verified paid visits are needed before redeeming a reward.");
  if (event.type === "redeem" && event.credits !== -4) throw new Error("A reward uses four visits.");
  if (event.reference && card.events.some(e => e.reference === event.reference && e.type !== "void" && !card.events.some(v => v.type === "void" && v.targetId === e.id))) throw new Error("That receipt or booking reference is already recorded on this card.");
  if (event.type === "void") {
    const target = card.events.find(e => e.id === event.targetId);
    if (!target || target.type === "void" || card.events.some(e => e.type === "void" && e.targetId === target.id)) throw new Error("This entry cannot be reversed.");
    if (!event.notes) throw new Error("Enter a reason for the correction.");
  }
  const next = { ...card, version: card.version + 1, events: [...card.events, event] };
  if (loyaltyTotals(next).balance < 0) throw new Error("Reverse the reward redemption first; those visits have already been used.");
  return next;
}
