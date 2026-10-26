import assert from "node:assert/strict";
import { listSmsMedia, fetchSmsMedia } from "../src/lib/twilio-media";

async function main() {
  process.env.TWILIO_ACCOUNT_SID = "AC" + "1".repeat(32);
  process.env.TWILIO_AUTH_TOKEN = "test-token";
  const sid = "MM" + "2".repeat(32);
  const media = "ME" + "3".repeat(32);
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (url, init) => {
    calls++;
    assert.ok(String(url).startsWith(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages/${sid}/Media`));
    assert.equal(new Headers(init?.headers).get("Authorization"), "Basic " + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:test-token`).toString("base64"));
    if (String(url).includes(".json")) return Response.json({media_list:[{sid:media,content_type:"image/jpeg"},{sid:"https://evil.example",content_type:"text/html"}]});
    return new Response("image-bytes", {headers:{"content-type":"image/jpeg"}});
  };
  try {
    assert.deepEqual(await listSmsMedia(sid), [{sid:media,contentType:"image/jpeg"}]);
    assert.equal(await (await fetchSmsMedia(sid,media)).text(), "image-bytes");
    await assert.rejects(() => listSmsMedia("../../anything"));
    await assert.rejects(() => fetchSmsMedia(sid,"https://evil.example"));
    assert.equal(calls,2);
    globalThis.fetch = async () => new Response("gone", {status:404});
    await assert.rejects(() => fetchSmsMedia(sid,media));
    console.log("MMS metadata, authenticated fetch, invalid identifiers, and unavailable media passed.");
  } finally { globalThis.fetch = original; }
}
main();
