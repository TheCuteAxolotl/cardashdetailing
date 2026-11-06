"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";

export default function StoreRefresh(){
  const router=useRouter();
  useEffect(()=>{
    function refresh(){if(document.visibilityState==="visible") router.refresh();}
    function changed(event:StorageEvent){if(event.key==="merch-shop-updated") refresh();}
    window.addEventListener("storage",changed);
    document.addEventListener("visibilitychange",refresh);
    const timer=window.setInterval(refresh,60000);
    return ()=>{
      window.clearInterval(timer);
      window.removeEventListener("storage",changed);
      document.removeEventListener("visibilitychange",refresh);
    };
  },[router]);
  return null;
}
