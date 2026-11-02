import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { prisma } from '../src/lib/prisma';
import { createToken } from '../src/lib/auth';
import { GET, POST, PATCH } from '../src/app/api/jobs/route';
import { GET as getPhotos, POST as uploadPhoto } from '../src/app/api/jobs/[id]/photos/route';
import { POST as createEmployee } from '../src/app/api/jobs/team/route';
import { emptyJobData } from '../src/lib/job-workflow';
import { lockedJob } from '../src/lib/jobs';
import type { Prisma } from '@prisma/client';

// Mock only the persistence boundary. Exercise real session permission checks and route handlers.
const restore: (()=>void)[]=[];
function replace(obj:object,key:string,value:unknown){const target=obj as Record<string,unknown>;const old=target[key];target[key]=value;restore.push(()=>{target[key]=old;});}
replace(prisma.user,'findUnique',async()=>({id:'detailer-a',email:'detailer-a@example.test',name:'Detailer A',role:'user'}));
replace(prisma.customRoleAssignment,'findMany',async()=>[]);
replace(prisma.userPermissionOverride,'findMany',async()=>[{permission:'assignedJobs',allowed:true}]);
replace(prisma,'$executeRawUnsafe',async()=>0);
replace(prisma,'$executeRaw',async()=>0);
let reads=0;
replace(prisma,'$queryRaw',async()=>{reads++;return [{id:'job-b',assigneeId:'detailer-b',state:'assigned',version:1,data:emptyJobData()}];});
after(()=>restore.reverse().forEach(fn=>fn()));
function req(method='GET',body?:unknown,authenticated=true,crossSite=false){return new NextRequest('https://cardashdetailing.com/api/jobs',{
 method,headers:{...(authenticated?{cookie:`auth-token=${createToken({id:'detailer-a',email:'detailer-a@example.test',role:'user'})}`} : {}),...(body?{'Content-Type':'application/json'}:{}),...(crossSite?{origin:'https://unrelated.example'}:{})},...(body?{body:JSON.stringify(body)}:{})});}
const context={params:Promise.resolve({id:'job-b'})};
test('all job endpoints reject unauthenticated requests before persistence',async()=>{
 for(const response of [await GET(req('GET',undefined,false)),await POST(req('POST',{},false)),await PATCH(req('PATCH',{},false)),await getPhotos(req('GET',undefined,false),context),await uploadPhoto(req('POST',{},false),context),await createEmployee(req('POST',{},false))])assert.equal(response.status,401);
 assert.equal(reads,0);
});
test('detailers cannot assign bookings or create staff accounts',async()=>{
 assert.equal((await POST(req('POST',{}))).status,403);
 assert.equal((await createEmployee(req('POST',{}))).status,403);
 assert.equal(reads,0);
});
test('cross-origin mutations are rejected',async()=>{
 assert.equal((await PATCH(req('PATCH',{},true,true))).status,403);
 assert.equal((await uploadPhoto(req('POST',{},true,true),context)).status,403);
});
test('another employee cannot retrieve private photo metadata or bytes',async()=>{
 const response=await getPhotos(req(),context);assert.equal(response.status,404);
 const binary=req();binary.nextUrl.searchParams.set('photo','private-photo-id');
 assert.equal((await getPhotos(binary,context)).status,404);
 assert.equal(reads,2); // Only ownership reads; never reaches the photo bytes query.
});
test('locked mutations reject other employees and stale versions',async()=>{
 const actor={id:'detailer-a',email:'detailer-a@example.test',name:'A',role:'user',permissions:['assignedJobs' as const],customRoles:[]};
 const tx={$queryRaw:async()=>[{id:'job',assigneeId:'detailer-b',state:'assigned',version:3,data:emptyJobData()}]} as unknown as Prisma.TransactionClient;
 await assert.rejects(()=>lockedJob(tx,'job',actor,3),/not found/);
 const owner={...actor,role:'owner'};
 await assert.rejects(()=>lockedJob(tx,'job',owner,2),/changed/);
 assert.equal((await lockedJob(tx,'job',owner,3)).version,3);
});
