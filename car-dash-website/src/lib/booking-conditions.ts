// Condition tags customers can tap during online booking ("Anything else we
// should know?"). Shared by the booking form and the booking API, which only
// saves tags from this list. Tags never change the price on their own: they
// can suggest a matching add-on, which the customer chooses to add.
export type ConditionTag = {
  id: string;
  label: string;
  icon: string;
  /** Add-on ids to suggest, first match that is active wins. */
  suggest?: string[];
  /** Conditions that may need a look before the price is final. */
  mayNeedQuote?: boolean;
};

export const CONDITION_TAGS: ConditionTag[] = [
  { id: "pet-hair", label: "Pet hair", icon: "paw", suggest: ["pet-hair"] },
  { id: "stains", label: "Stains", icon: "stain", suggest: ["heavy-stains", "seat-shampoo"] },
  { id: "odor", label: "Odor", icon: "odor", suggest: ["odor-treatment"] },
  { id: "smoke", label: "Smoke smell", icon: "smoke", suggest: ["odor-smoke"] },
  { id: "sand", label: "Sand", icon: "sand", suggest: ["carpet-extraction"] },
  { id: "heavy-dirt", label: "Heavy dirt", icon: "mud", suggest: ["carpet-extraction"] },
  { id: "food-spills", label: "Food spills", icon: "cup", suggest: ["seat-shampoo"] },
  { id: "bugs-tar", label: "Bugs & tar", icon: "bug", suggest: ["bug-tar"] },
  { id: "mold", label: "Mold", icon: "mold", mayNeedQuote: true },
];

export const CONDITION_TAG_IDS = CONDITION_TAGS.map((tag) => tag.id);

export function conditionTagLabels(ids: string[]) {
  return CONDITION_TAGS.filter((tag) => ids.includes(tag.id)).map((tag) => tag.label);
}

/** Tags saved on a booking's "Condition notes:" line, as ids. */
export function conditionTagsFromNotes(notes: string | null | undefined) {
  const line = String(notes || "").match(/^Condition notes:\s*(.*)$/m)?.[1] || "";
  const labels = line.split(/,\s*/).map((item) => item.trim().toLowerCase());
  return CONDITION_TAGS.filter((tag) => labels.includes(tag.label.toLowerCase())).map((tag) => tag.id);
}

export function cleanConditionTags(value: unknown) {
  return Array.isArray(value) ? [...new Set(value.map(String))].filter((id) => CONDITION_TAG_IDS.includes(id)) : [];
}

/** Sets the booking's "Condition notes:" line, keeping every other note. */
export function withConditionNotes(notes: string, ids: string[]) {
  const line = `Condition notes: ${ids.length ? conditionTagLabels(ids).join(", ") : "None"}`;
  return /^Condition notes:.*$/m.test(notes) ? notes.replace(/^Condition notes:.*$/m, line) : [notes, line].filter(Boolean).join("\n");
}
