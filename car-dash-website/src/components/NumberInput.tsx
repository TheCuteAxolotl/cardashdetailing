"use client";
import {useState,type InputHTMLAttributes} from "react";

/** Keep the editable text independent of the numeric value used for totals. */
export default function NumberInput({value,onChange,onFocus,onBlur,...props}:InputHTMLAttributes<HTMLInputElement>){
 const [editing,setEditing]=useState(false);
 const [draft,setDraft]=useState("");
 return <input {...props} type="number" value={editing?draft:value} onFocus={event=>{
  setDraft(event.currentTarget.value);setEditing(true);
  if(event.currentTarget.value==="0") event.currentTarget.select();
  onFocus?.(event);
 }} onChange={event=>{
  setDraft(event.currentTarget.value);
  onChange?.(event);
 }} onBlur={event=>{
  setEditing(false);onBlur?.(event);
 }}/>;
}
