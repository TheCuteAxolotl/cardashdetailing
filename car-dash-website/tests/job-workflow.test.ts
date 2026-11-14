import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canAccessJob,
  emptyJobData,
  isEditable,
  JOB_CHECKS,
  missingEvidence,
  transitionError,
  type PhotoMeta,
} from "../src/lib/job-workflow";
const data = () => ({
  ...emptyJobData(),
  damageNotes: "No damage observed",
  checks: [...JOB_CHECKS],
});
const photos = (): PhotoMeta[] =>
  ["before", "after"].map((phase, i) => ({
    id: String(i),
    phase,
    area: "Other / service detail",
    createdAt: new Date("2026-11-02T12:00:00Z"),
    uploadedBy: "Detailer",
  }));
test("assignment access never grants another employee access", () => {
  assert.equal(canAccessJob(false, "employee-a", "employee-b"), false);
  assert.equal(canAccessJob(false, "employee-a", "employee-a"), true);
  assert.equal(canAccessJob(true, "owner", "employee-b"), true);
});
test("photos, condition notes and checklist are optional throughout work", () => {
  for (const [state,action] of [["assigned","start"],["in_progress","submit"],["needs_touch_up","submit"]] as const)
    assert.equal(transitionError(state,action,false,emptyJobData(),[]),null);
  assert.match(transitionError("assigned","submit",false,data(),[])!,/Start/);
});
test("legacy area metadata remains readable",()=>{
  assert.deepEqual(missingEvidence(["Wheels"],photos()),["before: Wheels","after: Wheels"]);
});
test("employees cannot approve, return, or reopen their own work", () => {
  for (const action of ["approve", "return"])
    assert.match(
      transitionError("awaiting_review", action, false, data(), photos())!,
      /owner/,
    );
  assert.match(
    transitionError("approved", "reopen", false, data(), photos())!,
    /owner/,
  );
  assert.equal(
    transitionError("awaiting_review", "approve", true, data(), photos()),
    null,
  );
  assert.match(
    transitionError("in_progress", "approve", true, data(), photos())!,
    /not awaiting/,
  );
});
test("submitted evidence is locked; touch-up is editable", () => {
  assert.equal(isEditable("awaiting_review"), false);
  assert.equal(isEditable("approved"), false);
  assert.equal(isEditable("needs_touch_up"), true);
});
