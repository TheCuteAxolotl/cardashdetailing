export const JOB_STATES = [
  "assigned",
  "in_progress",
  "awaiting_review",
  "needs_touch_up",
  "approved",
] as const;
export type JobState = (typeof JOB_STATES)[number];
export const PHOTO_AREAS = [
  "Exterior front",
  "Exterior rear",
  "Driver side",
  "Passenger side",
  "Front seats & dashboard",
  "Rear seats & floors",
  "Cargo area",
  "Wheels",
  "Other / service detail",
] as const;
export const JOB_CHECKS = [
  "All assigned services completed",
  "Surfaces inspected under good lighting",
  "Customer belongings returned and work area cleaned",
  "Final condition checked and ready for the customer",
] as const;
export type JobData = {
  instructions: string;
  damageNotes: string;
  workNotes: string;
  feedback: string;
  checks: string[];
  requiredAreas: string[];
  startedAt?: string | null;
  finishedAt?: string | null;
  history: { at: string; actor: string; action: string; note?: string }[];
};
export type JobRow = {
  id: string;
  assigneeId: string;
  state: JobState;
  version: number;
  data: JobData;
  updatedAt: Date;
};
export type PhotoMeta = {
  id: string;
  phase: string;
  area: string;
  createdAt: Date;
  uploadedBy: string;
};
export function emptyJobData(): JobData {
  return {
    instructions: "",
    damageNotes: "",
    workNotes: "",
    feedback: "",
    checks: [],
    requiredAreas: [],
    startedAt: null,
    finishedAt: null,
    history: [],
  };
}
export function canAccessJob(
  owner: boolean,
  actorId: string,
  assigneeId: string,
) {
  return owner || actorId === assigneeId;
}
export function isEditable(state: JobState) {
  return ["assigned", "in_progress", "needs_touch_up"].includes(state);
}
export function missingEvidence(
  areas: string[],
  photos: Pick<PhotoMeta, "phase" | "area">[],
  phases = ["before", "after"],
) {
  return phases.flatMap((phase) =>
    areas
      .filter(
        (area) => !photos.some((p) => p.phase === phase && p.area === area),
      )
      .map((area) => `${phase}: ${area}`),
  );
}
export function transitionError(
  state: JobState,
  action: string,
  owner: boolean,
  _data: JobData,
  _photos: PhotoMeta[],
): string | null {
  if (action === "start") {
    if (state !== "assigned") return "Only assigned jobs can be started.";
  } else if (action === "submit") {
    if (!["in_progress", "needs_touch_up"].includes(state))
      return "Start the job before marking it complete.";
    // Photos, condition notes and checklist entries are optional.
  } else if (action === "approve" || action === "return") {
    if (!owner) return "Only the owner can review work.";
    if (state !== "awaiting_review") return "This job is not awaiting review.";
  } else if (action === "reopen") {
    if (!owner || state !== "approved")
      return "Only the owner can reopen an approved job.";
  } else return "Unknown job action.";
  return null;
}
