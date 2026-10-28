import assert from 'node:assert/strict';
import {discordIpLine} from '../src/lib/discord-ip';
import {notifyQuoteDiscord} from '../src/lib/discord-quotes';
import {notifyBookingChatDiscord} from '../src/lib/booking-chat';
async function main(){
 assert.equal(discordIpLine('2001:db8::abcd'),'IP address (public): 2001:db8::abcd');
 assert.equal(discordIpLine('203.0.113.42'),'IP address (public): 203.0.113.42');
 assert.ok(discordIpLine(undefined,'Gmail').includes('Unavailable'));
 assert.ok(discordIpLine('unknown','Website request').includes('Website request'));
 assert.ok(discordIpLine('1.2.3.4\n@everyone').includes('Unavailable'));
 const oldFetch=globalThis.fetch;const oldWebhook=process.env.DISCORD_WEBHOOK_URL;const sent:string[]=[];
 process.env.DISCORD_WEBHOOK_URL='https://example.invalid/mock';
 globalThis.fetch=async(_url,options)=>{sent.push(JSON.parse(String(options?.body)).content);return new Response('{}');};
 try{
 await notifyQuoteDiscord({clientIp:'203.0.113.42',title:'Quote',customerName:'Customer',subject:'Test',threadId:'test',message:'x'.repeat(4000)});
 await notifyBookingChatDiscord({clientIp:'2001:db8::abcd',bookingId:'test',customerName:'Customer',customerEmail:'test@example.com',serviceName:'Detail',vehicle:'Car',message:'x'.repeat(4000)});
 await notifyQuoteDiscord({title:'SMS',customerName:'Customer',subject:'Test',threadId:'test'});
 assert.ok(sent[0].includes('IP address (public): 203.0.113.42'));
 assert.ok(sent[1].includes('IP address (public): 2001:db8::abcd'));
 assert.ok(sent[2].includes('Unavailable (SMS provider'));
 assert.ok(sent.every(text=>text.length<=1950));
 }finally{globalThis.fetch=oldFetch;if(oldWebhook===undefined)delete process.env.DISCORD_WEBHOOK_URL;else process.env.DISCORD_WEBHOOK_URL=oldWebhook;}
 console.log('Exact IPv4/IPv6, invalid IP rejection, unavailable provider IPs, and long-notification IP preservation passed. No real Discord messages sent.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
