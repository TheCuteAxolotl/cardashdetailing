export type OwnerScheduleTask = {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime: string;
  notes: string;
  completed: boolean;
  type: "todo" | "plan";
  createdAt: string;
  updatedAt: string;
};

export type OwnerScheduleData = {
  version: number;
  tasks: OwnerScheduleTask[];
};

export const DEFAULT_OWNER_SCHEDULE: OwnerScheduleData = {
  version: 1,
  tasks: [],
};

function cleanText(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function cleanDate(value: unknown) {
  const text = cleanText(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function cleanTime(value: unknown) {
  const text = cleanText(value, 5);
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(text) ? text : "";
}

export function sanitizeOwnerSchedule(value: unknown): OwnerScheduleData {
  const source = value && typeof value === "object" ? value as Partial<OwnerScheduleData> : {};
  const rawTasks = Array.isArray(source.tasks) ? source.tasks : [];
  const now = new Date().toISOString();

  const tasks = rawTasks
    .slice(0, 500)
    .map((raw, index) => {
      const item = raw && typeof raw === "object" ? raw as Partial<OwnerScheduleTask> : {};
      const date = cleanDate(item.date);
      const title = cleanText(item.title, 180);
      if (!date || !title) return null;

      return {
        id: cleanText(item.id, 100) || `task-${index + 1}`,
        title,
        date,
        time: cleanTime(item.time),
        endTime: cleanTime(item.endTime),
        notes: cleanText(item.notes, 2000),
        completed: Boolean(item.completed),
        type: item.type === "plan" ? "plan" : "todo",
        createdAt: cleanText(item.createdAt, 40) || now,
        updatedAt: cleanText(item.updatedAt, 40) || now,
      } satisfies OwnerScheduleTask;
    })
    .filter((item): item is OwnerScheduleTask => Boolean(item));

  return { version: 1, tasks };
}

export function parseOwnerSchedule(value: string | null | undefined): OwnerScheduleData {
  if (!value) return DEFAULT_OWNER_SCHEDULE;
  try {
    return sanitizeOwnerSchedule(JSON.parse(value));
  } catch {
    return DEFAULT_OWNER_SCHEDULE;
  }
}
