"use client";
import GiftCardPurchase from "@/components/GiftCardPurchase";
import { useRef, useState, type FormEvent } from 'react';
import { giftMoney } from '@/lib/gift-cards';
export default function GiftCardBalancePage() {
  const [code,setCode]=useState('');
  const [result,setResult]=useState<{balance:number;paused:boolean;lastFour:string}|null>(null);
  const [error,setError]=useState(''); const [busy,setBusy]=useState(false); const sequence=useRef(0);
  async function check(value:string) {
    const current=++sequence.current; setBusy(true);setError('');setResult(null);
    try { const r=await fetch('/api/gift-cards',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:value}),cache:'no-store'});const data=await r.json();if(current!==sequence.current)return;if(!r.ok)throw new Error(data.error);setResult(data); }
    catch(e){if(current===sequence.current)setError(e instanceof Error?e.message:'Unable to check the balance.');}
    finally{if(current===sequence.current)setBusy(false);}
  }
  function submit(e:FormEvent){e.preventDefault();void check(code);}
  return <main className="min-h-[75vh] bg-[#111] px-5 py-16 text-[#f4efe5]"><div className="mx-auto max-w-lg"><GiftCardPurchase/><div className="rounded-2xl border border-[#d6b779]/30 bg-[#191919] p-7 sm:p-10"><p className="text-xs uppercase tracking-[.2em] text-[#d6b779]">Car Dash gift cards</p><h1 className="mt-4 font-serif text-4xl">A little care, gifted.</h1><p className="mt-4 text-sm leading-6 text-white/65">Enter the unique number printed on your physical gift card to check the remaining balance. Present the card to Car Dash when paying for your detail.</p><form onSubmit={submit} className="mt-7"><label className="text-sm">Card number<input value={code} onChange={e=>{sequence.current++;setBusy(false);setError('');setCode(e.target.value);setResult(null);}} autoCapitalize="characters" spellCheck={false} autoComplete="off" maxLength={24} required className="mt-2 w-full rounded-xl border border-white/20 bg-[#111] px-4 py-3 font-mono text-sm"/></label><button disabled={busy} className="mt-4 rounded-full bg-[#d6b779] px-6 py-3 font-semibold text-[#111] disabled:opacity-40">{busy?'Checking…':'Check balance'}</button></form>{error&&<p role="alert" className="mt-5 text-red-200">{error}</p>}{result&&<div role="status" className="mt-7 border-t border-white/15 pt-6"><p className="text-sm text-white/65">Card ending {result.lastFour}</p><p className="mt-2 font-serif text-5xl">{giftMoney(result.balance)}</p><p className="mt-3 text-sm text-[#d6b779]">{result.paused?'This card is paused. Contact Car Dash before using it.':'Available toward Car Dash detailing services.'}</p></div>}<p className="mt-8 text-xs leading-5 text-white/55">Keep the card and its number private. Scanning checks the balance; it does not spend or add money.</p><a href="tel:+12243443451" className="mt-4 inline-block text-sm text-[#d6b779]">Questions? (224) 344-3451</a></div></div></main>;
}
