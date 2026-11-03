export type SavedAddress={
  id:string;label:string;line1:string;line2:string;city:string;state:string;postalCode:string;
  instructions:string;
};
export type AccountProfile={
  phone:string;
  contactPreference:"sms"|"call"|"email";
  avatar:string|null;
  addresses:SavedAddress[];
  defaultAddressId:string|null;
};
export const EMPTY_ACCOUNT_PROFILE:AccountProfile={
  phone:"",contactPreference:"sms",avatar:null,addresses:[],defaultAddressId:null,
};
const clean=(value:unknown,max:number)=>typeof value==="string"?value.trim().slice(0,max):"";
const validId=(id:string)=>/^[a-z0-9_-]{5,80}$/i.test(id);
const MAX_AVATAR_LENGTH=160000;
/** This profile is private and must never be serialized into public site-content. */
export function normalizeAccountProfile(value:unknown):AccountProfile|null{
  if(!value||typeof value!=="object"||Array.isArray(value))return null;
  const raw=value as Record<string,unknown>;
  const phone=clean(raw.phone,26);
  if(phone && !/^\+?[\d\s().-]{7,26}$/.test(phone))return null;
  const preference=raw.contactPreference;
  if(preference!=="sms"&&preference!=="call"&&preference!=="email")return null;
  if(raw.avatar!==null&&raw.avatar!==undefined&&
    (typeof raw.avatar!=="string"||raw.avatar.length>MAX_AVATAR_LENGTH||
      !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(raw.avatar)))return null;
  if(Array.isArray(raw.addresses)===false||raw.addresses.length>8)return null;
  const addresses:SavedAddress[]=[];
  const ids=new Set<string>();
  for(const item of raw.addresses){
    if(!item||typeof item!=="object"||Array.isArray(item))return null;
    const a=item as Record<string,unknown>;
    const id=clean(a.id,80);
    if(!validId(id)||ids.has(id))return null;
    ids.add(id);
    const address:SavedAddress={
      id,label:clean(a.label,45),line1:clean(a.line1,160),line2:clean(a.line2,160),
      city:clean(a.city,80),state:clean(a.state,40),postalCode:clean(a.postalCode,16),
      instructions:clean(a.instructions,350),
    };
    if(!address.line1||!address.city||!address.state||!address.postalCode)return null;
    addresses.push(address);
  }
  const preferred=clean(raw.defaultAddressId,80);
  if(preferred&&!ids.has(preferred))return null;
  return {
    phone,contactPreference:preference,avatar:raw.avatar||null,
    addresses,defaultAddressId:preferred||null,
  };
}
export function decodeStoredProfile(value:string|null|undefined):AccountProfile{
  if(!value)return {...EMPTY_ACCOUNT_PROFILE};
  try{
    const raw=JSON.parse(value);
    return normalizeAccountProfile(raw)||{...EMPTY_ACCOUNT_PROFILE};
  }catch{return {...EMPTY_ACCOUNT_PROFILE};}
}
export function formatSavedAddress(address:SavedAddress):string{
  return [address.line1,address.line2,address.city,address.state+" "+address.postalCode].filter(Boolean).join(", ");
}
