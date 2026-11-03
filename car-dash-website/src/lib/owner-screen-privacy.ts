"use client";

import { useEffect, useState } from "react";

export const OWNER_PRIVACY_EVENT = "car-dash-owner-screen-privacy-change";
const MODE_KEY = "cardash_owner_recording_mode_v1";
const ALIAS_KEY = "cardash_owner_display_names_v1";
export type ContactAliases = Record<string,string>;

export function normalizeContactPhone(input:string):string {
  const digits=input.replace(/\D/g,"");
  if(digits.length===11&&digits.startsWith("1"))return digits.slice(1);
  return digits.length===10?digits:"";
}
const PHONE_PATTERN=/(?<!\d)(?:\+?1[\s.()-]?)?(?:\(\d{3}\)|\d{3})[\s.()-]?\d{3}[\s.()-]?\d{4}(?!\d)/g;
export function phoneMatches(value:string):string[]{
  const found=new Set<string>();
  for(const match of value.matchAll(PHONE_PATTERN)){
    const phone=normalizeContactPhone(match[0]);
    if(phone)found.add(phone);
  }
  return [...found];
}
export function safeCustomerText(text:string,aliases:ContactAliases):string {
  // Always avoid showing raw customer phone numbers in the home activity feed.
  return (text||"").replace(PHONE_PATTERN,(match)=>{
    const normalized=normalizeContactPhone(match);
    return normalized?(aliases[normalized]||"Unknown customer"):match;
  });
}
function readAliases(key=ALIAS_KEY):ContactAliases {
  if(typeof window==="undefined")return {};
  try{
    const raw=JSON.parse(window.localStorage.getItem(key)||"{}");
    if(!raw||typeof raw!=="object"||Array.isArray(raw))return {};
    const clean:ContactAliases={};
    for(const [key,value] of Object.entries(raw)){
      if(normalizeContactPhone(key)===key&&typeof value==="string"){
        const name=value.replace(/[\r\n\t]+/g," ").trim().slice(0,64);
        if(name)clean[key]=name;
      }
    }
    return clean;
  }catch{return {};}
}
export function useOwnerScreenPrivacy(scope:"owner"|"staff"="owner"){
  const modeKey=scope==="staff"?"cardash_staff_recording_mode_v1":MODE_KEY;
  const aliasKey=scope==="staff"?"cardash_staff_display_names_v1":ALIAS_KEY;
  const [recording,setRecording]=useState(true);
  const [aliases,setAliases]=useState<ContactAliases>({});
  useEffect(()=>{
    const load=()=>{
      setRecording(window.localStorage.getItem(modeKey)==="yes");
      setAliases(readAliases(aliasKey));
    };
    load();
    window.addEventListener("storage",load);
    window.addEventListener(OWNER_PRIVACY_EVENT,load);
    return()=>{
      window.removeEventListener("storage",load);
      window.removeEventListener(OWNER_PRIVACY_EVENT,load);
    };
  },[modeKey,aliasKey]);
  const changeRecording=(value:boolean)=>{
    try{window.localStorage.setItem(modeKey,value?"yes":"no");}catch{}
    setRecording(value);
    window.dispatchEvent(new Event(OWNER_PRIVACY_EVENT));
  };
  const saveAlias=(phoneInput:string,nameInput:string)=>{
    const phone=normalizeContactPhone(phoneInput);
    const name=nameInput.replace(/[\r\n\t]+/g," ").trim().slice(0,64);
    if(!phone)return "Enter a valid 10-digit US phone number.";
    if(name&&phoneMatches(name).length)return "Display names cannot contain phone numbers.";
    const next={...readAliases(aliasKey)};
    if(name)next[phone]=name;else delete next[phone];
    try{window.localStorage.setItem(aliasKey,JSON.stringify(next));}catch{return "Could not save the label on this device.";}
    setAliases(next);
    window.dispatchEvent(new Event(OWNER_PRIVACY_EVENT));
    return "";
  };
  return {recording,aliases,changeRecording,saveAlias};
}
