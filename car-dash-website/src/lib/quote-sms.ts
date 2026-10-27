import { prisma } from "@/lib/prisma";

export async function getQuoteSmsContact(threadId: string) {
  const systemMessage = await prisma.quoteMessage.findFirst({
    where: {
      threadId,
      sender: "system",
      body: { startsWith: "SMS contact:" },
    },
    orderBy: { createdAt: "asc" },
    select: { body: true },
  });

  if (!systemMessage) {
    const thread=await prisma.quoteThread.findUnique({where:{id:threadId},select:{guestPhone:true,userId:true}});
    if(thread?.guestPhone&&thread.userId){const owner=await prisma.siteContent.findUnique({where:{key:`verified_phone_${thread.guestPhone}`}});if(owner?.value===thread.userId)return {phone:thread.guestPhone,consent:true};}
    return { phone: null, consent: false };
  }

  const match = systemMessage.body.match(/^SMS contact:\s*(.*?)\s*·\s*consent:\s*(Yes|No)$/i);
  if (!match) return { phone: null, consent: false };

  const rawPhone = match[1].trim();
  return {
    phone: rawPhone && rawPhone.toLowerCase() !== "not provided" ? rawPhone : null,
    consent: match[2].toLowerCase() === "yes",
  };
}
