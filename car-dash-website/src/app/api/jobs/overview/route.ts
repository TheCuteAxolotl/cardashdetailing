import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {ensureJobs,jobAccount,jobResponseError,noStore} from "@/lib/jobs";
import {readTeams} from "@/lib/detailer-teams";

export async function GET(req:NextRequest) {
  try {
    const actor=await jobAccount(req), owner=actor.role==="owner";
    await ensureJobs();
    const teams=(await readTeams()).teams.filter(t=>owner || t.memberIds.includes(actor.id));
    const members=[actor.id,...teams.flatMap(t=>t.memberIds)];
    const [clocks,jobs]=await Promise.all([
      prisma.$queryRaw<{name:string}[]>`SELECT u.name FROM "SiteContent" s JOIN "User" u ON s.key='shift:active:' || u.id WHERE ${owner} OR u.id=ANY(${members}::text[]) ORDER BY u.name`,
      prisma.$queryRaw<{id:string;service:string;state:string;pending:bigint}[]>`SELECT j.id,b."serviceName" AS service,j.state,
      (SELECT count(*) FROM "SiteContent" c WHERE starts_with(c.key,'collection:' || j.id || ':') AND c.value::jsonb->>'method'='Cash' AND c.value::jsonb->>'handoff' IS NULL) AS pending
      FROM "DetailJob" j JOIN "Booking" b ON b.id=j.id WHERE ${owner} OR j."assigneeId"=${actor.id} OR j.data->>'teamId'=ANY(${teams.map(t=>t.id)}::text[]) ORDER BY j."updatedAt" DESC`,
    ]);
    return NextResponse.json({clocks:clocks.map(c=>c.name),active:jobs.filter(j=>j.state==="in_progress").length,
      handoffs:jobs.filter(j=>Number(j.pending)>0).map(j=>({id:j.id,service:j.service,count:Number(j.pending)}))},{headers:noStore});
  }catch(e){return jobResponseError(e);}
}
