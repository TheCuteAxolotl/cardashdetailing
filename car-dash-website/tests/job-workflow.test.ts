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
test("before evidence and condition report are mandatory to start", () => {
  assert.match(
    transitionError("assigned", "start", false, data(), [])!,
    /before photo/,
  );
  assert.match(
    transitionError("assigned", "start", false, emptyJobData(), photos())!,
    /damage/,
  );
  assert.equal(
    transitionError("assigned", "start", false, data(), photos()),
    null,
  );
});
test("a photo of the wrong area or phase cannot satisfy required pairs", () => {
  assert.deepEqual(missingEvidence(["Wheels"], photos()), [
    "before: Wheels",
    "after: Wheels",
  ]);
  assert.match(
    transitionError(
      "in_progress",
      "submit",
      false,
      data(),
      photos().slice(0, 1),
    )!,
    /matching/,
  );
});
test("submission requires checklist and started state", () => {
  assert.match(
    transitionError("assigned", "submit", false, data(), photos())!,
    /Start/,
  );
  assert.match(
    transitionError(
      "in_progress",
      "submit",
      false,
      { ...data(), checks: [] },
      photos(),
    )!,
    /checklist/,
  );
  assert.equal(
    transitionError("in_progress", "submit", false, data(), photos()),
    null,
  );
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
test("touch-up resubmission needs a newly uploaded after photo", () => {
  const d = data();
  d.history = [
    {
      at: "2026-11-02T13:00:00Z",
      actor: "Owner",
      action: "return",
      note: "Clean wheels again",
    },
  ];
  assert.match(
    transitionError("needs_touch_up", "submit", false, d, photos())!,
    /new after photo/,
  );
  const p = photos();
  p[1].createdAt = new Date("2026-11-02T14:00:00Z");
  assert.equal(transitionError("needs_touch_up", "submit", false, d, p), null);
});
