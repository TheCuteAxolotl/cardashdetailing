import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getPermissionSnapshotForUser } from "@/lib/permissions";
import StaffGuideClient, { type StaffGuideSection } from "@/components/StaffGuideClient";

export const dynamic = "force-dynamic";

const sections: StaffGuideSection[] = [
  {
    id: "rules",
    eyebrow: "01 · Standards",
    title: "Rules",
    summary: "The non-negotiables for anyone representing Car Dash Detailing.",
    points: [
      "Be clear, respectful, and accurate. Never guess about pricing, availability, completion time, warranties, or what a service includes.",
      "Protect customer information. Do not share addresses, phone numbers, vehicle information, messages, photos, or account details outside the work needed to help that customer.",
      "Do not promise discounts, refunds, free add-ons, warranty coverage, or special exceptions unless you have permission to do so.",
      "Exact quotes should be honored when the customer accurately represented the vehicle. If the condition is materially different, stop and escalate before changing the price.",
      "Never argue with a customer. If the conversation becomes tense, acknowledge the concern, document the facts, and move it to the owner when needed.",
      "Keep internal notes factual. Do not insult customers, joke about them, or write anything you would not want shown back to them.",
      "Do not delete customer records, close important disputes, or block a customer solely because the conversation is difficult. Escalate first unless there is spam, abuse, or a clear safety issue.",
      "If you make a mistake, correct it quickly and tell the customer what changed. Do not hide it or blame another staff member.",
    ],
  },
  {
    id: "professionalism",
    eyebrow: "02 · Brand",
    title: "Car Dash Professionalism Guide",
    summary: "Friendly and human, but organized enough that the customer feels taken care of.",
    points: [
      "Use the customer’s name when you know it. Keep messages natural, not robotic or overly formal.",
      "Lead with the answer. If they ask a price, availability question, or what happens next, address that before adding extra information.",
      "Use short paragraphs. A customer on a phone should be able to understand the message in a few seconds.",
      "Avoid slang that could sound careless. Casual is fine; confusing, dismissive, or overly familiar is not.",
      "Confirm important details in writing: vehicle, service, exact quote, appointment date/time, mobile location, and any condition-based price changes.",
      "Never pressure someone into a higher package. Explain the difference and recommend only what makes sense for the vehicle.",
      "When something is uncertain, say what you need to verify and when the customer should expect an answer.",
      "End conversations with a clear next step instead of a vague 'let us know.'",
    ],
    scripts: [
      { label: "Good tone", text: "Absolutely — for that vehicle I’d want to look at the condition first so I can give you an exact price instead of overcharging you." },
      { label: "When unsure", text: "I don’t want to give you the wrong answer. Let me verify that with the owner and I’ll follow up here." },
    ],
  },
  {
    id: "support",
    eyebrow: "03 · Support",
    title: "Support Tickets",
    summary: "Acknowledge, understand, solve, confirm. Keep the customer updated while you work through the issue.",
    points: [
      "Read the full ticket and any previous messages before replying.",
      "Identify the actual request: booking help, pricing, website/account issue, service concern, refund/payment issue, warranty question, or something else.",
      "Ask only for information you actually need. Do not make the customer repeat details already visible in the ticket or account.",
      "If you can solve it, explain what you changed and what happens next. If you cannot, tell them you are escalating it instead of inventing an answer.",
      "Use Waiting only when you genuinely need something from the customer. Close the ticket only when the issue is resolved or the customer clearly no longer needs help.",
      "Escalate complaints involving damage, threats, refunds, chargebacks, legal claims, privacy concerns, warranty disputes, or anything that could materially affect the business.",
    ],
    scripts: [
      { label: "First reply", text: "Hi [Customer Name], this is [Your Name] with Car Dash Detailing. Thanks for reaching out — I’m reviewing this for you now." },
      { label: "Need more info", text: "I can help with that. Before I make any changes, can you confirm [specific detail]?" },
      { label: "Escalating", text: "I want to make sure this is handled correctly, so I’m sending this to the owner for review. We’ll follow up here once it’s been checked." },
      { label: "Closing reply", text: "You’re all set — [briefly state what was done]. If anything changes, reply here and we can pick the conversation back up. — [Your Name], Car Dash Detailing" },
    ],
  },
  {
    id: "calls",
    eyebrow: "04 · Phone",
    title: "Voice Calls",
    summary: "Answer quickly, identify yourself and Car Dash, then let the customer tell you what they need.",
    points: [
      "Answer in a quiet place when possible. Do not answer a customer call while you are unable to give them your attention.",
      "Write down the caller’s name, phone number, vehicle, requested service, and next step if the call creates a lead or changes a booking.",
      "Do not quote a complicated vehicle from memory if condition matters. Move them into Get an Exact Quote and request photos when needed.",
      "Repeat important appointment details before ending the call.",
      "If the caller is angry, lower the pace of the conversation. Do not match their tone. Move serious complaints to the owner.",
    ],
    scripts: [
      { label: "Answer", text: "Hi, this is [Your Name] from Car Dash Detailing. How can I help you today?" },
      { label: "Pricing needs review", text: "I can definitely get you an exact price. Since condition can change the amount, I’d rather review the vehicle than quote you too high or too low." },
      { label: "End the call", text: "Perfect, I have [next step] noted. You’ll receive the update through [text/booking chat/quote chat]. Thanks for calling Car Dash Detailing." },
    ],
  },
  {
    id: "quotes",
    eyebrow: "05 · Sales",
    title: "Quote Chat",
    summary: "The goal is an accurate exact quote, not automatically charging the highest listed price.",
    points: [
      "Review the vehicle year, make, model, service requested, condition selection, notes, and every uploaded photo before quoting.",
      "Use the public package price as a reference, not a reason to overcharge. A cleaner SUV that normally lists at $279 can reasonably receive a lower exact quote when the work supports it.",
      "Ask follow-up questions when photos do not show the problem areas, pet hair, stains, cargo area, third row, or exterior condition clearly enough.",
      "When sending an exact quote, make clear what is included and whether any unusual condition was excluded from that price.",
      "Do not stack unrequested add-ons into the quote. Explain optional upgrades separately.",
      "Once the customer accepts, make sure the accepted amount is the amount carried into booking.",
    ],
    scripts: [
      { label: "Opening", text: "Hi [Customer Name], [Your Name] from Car Dash here. I’m looking over your [Vehicle] and the photos you sent now." },
      { label: "Exact quote", text: "Based on the condition shown, your exact quote for [Service] is $[Amount]. That includes [key items]." },
      { label: "Need another photo", text: "Before I lock in the exact price, could you send one photo of [area]? I want to make sure I quote it fairly." },
    ],
  },
  {
    id: "booking-chat",
    eyebrow: "06 · Operations",
    title: "Booking Chat",
    summary: "Use booking chat for appointment-specific communication and keep the thread easy to follow.",
    points: [
      "Confirm the appointment date/time, vehicle, service, and mobile location when anything changes.",
      "Use the arrival update when the detailer is actually leaving or when an accurate arrival time is known.",
      "If running late, communicate before the appointment time whenever possible and give a realistic new ETA.",
      "Keep price changes out of casual conversation. If extra work is discovered, explain the reason and get agreement before proceeding.",
      "After completion, note anything the customer should know about curing, first wash timing, maintenance, or warranty requirements when applicable.",
    ],
    scripts: [
      { label: "Confirmed", text: "You’re confirmed for [Date] at [Time] for [Service]. We have your [Vehicle] on the booking." },
      { label: "Running late", text: "Quick update from Car Dash: we’re running about [time] behind and now expect to arrive around [ETA]. Sorry for the delay — I wanted to let you know before your appointment time." },
      { label: "Complete", text: "Your detail is complete. Thanks for choosing Car Dash Detailing — I’ve also added [maintenance/care note] for you." },
    ],
  },
  {
    id: "sms",
    eyebrow: "07 · Texting",
    title: "SMS Inbox",
    summary: "Texting should be fast and useful. Treat SMS as a customer conversation, not a marketing blast.",
    points: [
      "Reply to the message they actually sent. Do not send a canned response that ignores their question.",
      "Keep routine SMS messages concise. Move complex quote discussions into Quote Chat when photos or detailed pricing are needed.",
      "Before sending an arrival message, confirm you are actually on the way or that the ETA is realistic.",
      "Do not send repeated messages because a customer has not answered yet unless there is a real appointment need.",
      "Respect opt-outs. If someone uses STOP or clearly asks not to be texted, do not try to work around it.",
      "If an SMS is unmatched, identify the caller/customer before discussing private booking information.",
    ],
    scripts: [
      { label: "General reply", text: "Hi [Name], this is [Your Name] with Car Dash Detailing. [Direct answer]." },
      { label: "On the way", text: "Car Dash Detailing: Your detailer is on the way and is expected to arrive around [Time]. We’ll see you soon." },
      { label: "Move to quote", text: "I can get you an exact price. I’m going to send you through our quote request so we can review the vehicle/photos and price it correctly." },
    ],
  },
  {
    id: "escalation",
    eyebrow: "08 · Judgment",
    title: "When to Escalate to the Owner",
    summary: "Staff should solve routine issues confidently and escalate the things that can create financial, legal, safety, or reputation risk.",
    points: [
      "Vehicle damage claims or allegations that Car Dash caused damage.",
      "Refunds, chargebacks, disputed payments, large discounts, or requests for free corrective work.",
      "Threats, harassment, unsafe locations, aggressive behavior, or situations where a staff member does not feel safe.",
      "Warranty disputes, coating failure claims, or requests outside the written warranty terms.",
      "Legal threats, privacy/data requests, police/insurance requests, or requests for customer information from someone other than that customer.",
      "A customer asking for something you cannot confidently authorize or explain.",
    ],
  },
];

export default async function StaffGuidePage() {
  const tokenUser = await getCurrentUser();
  if (!tokenUser) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: tokenUser.id },
    select: { id: true, email: true, role: true, name: true },
  });
  if (!dbUser) redirect("/login");

  const access = await getPermissionSnapshotForUser(dbUser);
  if (access.role !== "owner" && !access.permissions.includes("staffGuide")) {
    redirect(access.staffAccess ? "/admin/dashboard" : "/dashboard");
  }

  return <StaffGuideClient sections={sections} isOwner={access.role === "owner"} permissions={access.permissions} />;
}
