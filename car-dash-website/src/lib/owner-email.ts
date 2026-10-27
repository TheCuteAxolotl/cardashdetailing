import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import { simpleParser } from "mailparser";
import { prisma } from "@/lib/prisma";
import { BUSINESS_GMAIL, decryptEmailSecret, encryptEmailSecret } from "@/lib/gmail-security";

const CONNECTION = "owner_gmail_connection";
export async function emailConfig() {
  const record = await prisma.siteContent.findUnique({ where: { key: CONNECTION } });
  return record ? JSON.parse(record.value) as { encrypted: string; connectedAt: string } : null;
}
export async function gmailPassword() {
  const config = await emailConfig();
  if (!config) throw new Error("Connect Gmail first.");
  return decryptEmailSecret(config.encrypted);
}
export function imapClient(pass: string) {
  return new ImapFlow({host:"imap.gmail.com",port:993,secure:true,auth:{user:BUSINESS_GMAIL,pass},logger:false,connectionTimeout:15000,greetingTimeout:15000,socketTimeout:20000});
}
export function smtpClient(pass: string) {
  return nodemailer.createTransport({host:"smtp.gmail.com",port:465,secure:true,auth:{user:BUSINESS_GMAIL,pass},connectionTimeout:15000,greetingTimeout:15000,socketTimeout:20000,disableFileAccess:true,disableUrlAccess:true});
}
export async function withMailbox<T>(folder: string, action: (client: ImapFlow) => Promise<T>, pass?: string) {
  const client = imapClient(pass || await gmailPassword());
  try {
    await client.connect();
    let path = "INBOX";
    if (folder === "sent") {
      const folders = await client.list();
      const sent = folders.find(item => item.specialUse === "\\Sent");
      if (!sent) throw new Error("Gmail Sent folder is unavailable.");
      path = sent.path;
    }
    await client.mailboxOpen(path);
    return await action(client);
  } finally { await client.logout().catch(() => client.close()); }
}
export async function connectGmail(pass: string) {
  const cursor = await withMailbox("inbox",async client => {
    const box = client.mailbox;
    if (!box) throw new Error("Inbox unavailable.");
    return { validity: String(box.uidValidity), next: box.uidNext };
  },pass);
  const smtp = smtpClient(pass);
  try { await smtp.verify(); } finally { smtp.close(); }
  await prisma.$transaction([
    prisma.siteContent.upsert({where:{key:CONNECTION},create:{key:CONNECTION,value:JSON.stringify({encrypted:encryptEmailSecret(pass),connectedAt:new Date().toISOString()})},update:{value:JSON.stringify({encrypted:encryptEmailSecret(pass),connectedAt:new Date().toISOString()})}}),
    prisma.siteContent.upsert({where:{key:"owner_gmail_cursor"},create:{key:"owner_gmail_cursor",value:JSON.stringify(cursor)},update:{value:JSON.stringify(cursor)}}),
  ]);
}
export async function listGmail(folder: string) {
  return withMailbox(folder,async client => {
    if (!client.mailbox || !client.mailbox.exists) return [];
    const first = Math.max(1,client.mailbox.exists-49), result=[];
    for await (const message of client.fetch(`${first}:*`,{uid:true,envelope:true,flags:true,bodyStructure:true})) {
      const envelope = message.envelope;
      result.push({uid:message.uid,validity:String(client.mailbox.uidValidity),folder,
        subject:envelope?.subject || "(No subject)",from:envelope?.from?.map(x => x.name ? `${x.name} <${x.address}>` : x.address).join(", ") || "",
        to:envelope?.to?.map(x => x.address).join(", ") || "",date:envelope?.date ? new Date(envelope.date).toISOString() : null,
        unread:!message.flags?.has("\\Seen")});
    }
    return result.reverse();
  });
}
export async function readGmail(folder: string, uid: number, validity: string) {
  return withMailbox(folder,async client => {
    if (!client.mailbox || String(client.mailbox.uidValidity)!==validity) throw new Error("Inbox changed. Refresh and reopen this message.");
    const meta = await client.fetchOne(uid,{size:true},{uid:true});
    if (!meta) throw new Error("Message no longer available.");
    if ((meta.size || 0)>25*1024*1024) throw new Error("This email is larger than 25 MB. Open it in Gmail.");
    const message = await client.fetchOne(uid,{source:true},{uid:true});
    if (!message || !message.source) throw new Error("Message no longer available.");
    return simpleParser(message.source,{skipHtmlToText:false,skipTextToHtml:true,skipImageLinks:true});
  });
}
export async function syncEmailDiscord() {
  if (!await emailConfig()) return {connected:false,notified:0};
  const webhook = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!webhook) throw new Error("Discord notifications are not configured.");
  return withMailbox("inbox",async client => {
    if (!client.mailbox) throw new Error("Inbox unavailable.");
    const box = client.mailbox;
    // Serializes workers and retains a cursor only after Discord accepts each alert.
    return prisma.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('owner-gmail-sync'))`;
      const record = await tx.siteContent.findUnique({where:{key:"owner_gmail_cursor"}});
      const cursor = record ? JSON.parse(record.value) as {validity:string;next:number} : null;
      let next = cursor?.validity === String(box.uidValidity) ? cursor.next : box.uidNext;
      let notified=0;
      if (next < box.uidNext) {
        const ids = await client.search({uid:`${next}:${box.uidNext-1}`},{uid:true});
        const batch = (ids || []).slice(0, 30);
        const lines: string[] = [];
        for (const uid of batch) {
          const message = await client.fetchOne(uid,{envelope:true},{uid:true});
          if (!message) { next=uid+1; continue; }
          const from = message.envelope?.from?.map(x=>x.address).join(", ") || "Unknown sender";
          const subject = message.envelope?.subject || "(No subject)";
          lines.push(`${from.slice(0,100)} — ${subject.slice(0,160)}`);
          next=uid+1;
        }
        if (lines.length) {
          const response = await fetch(webhook,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:"Car Dash Email",allowed_mentions:{parse:[]},content:`${lines.length} new email${lines.length===1?"":"s"}\n${lines.join("\n").slice(0,1700)}\nhttps://cardashdetailing.com/owner/email`}),signal:AbortSignal.timeout(8000)});
          if (!response.ok) throw new Error("Discord could not accept the notification. Try syncing again.");
          notified=lines.length;
        }
        if (!ids || ids.length===0) next=box.uidNext;
      }
      const value=JSON.stringify({validity:String(box.uidValidity),next});
      await tx.siteContent.upsert({where:{key:"owner_gmail_cursor"},create:{key:"owner_gmail_cursor",value},update:{value}});
      return {connected:true,notified};
    },{maxWait:5000,timeout:55000});
  });
}
