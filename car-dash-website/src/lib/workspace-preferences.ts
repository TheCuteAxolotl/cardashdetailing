import { ADMIN_DEFAULT_PERMISSIONS } from "./access-control";

export type Appearance = "light" | "dark";
export type WorkspaceAccount = { id: string; role?: string | null };

function read(id: string, setting: string) {
  try { return localStorage.getItem(`car-dash:${id}:${setting}`); }
  catch { return null; }
}

export function savePreference(id: string, setting: "appearance" | "view", value: string) {
  localStorage.setItem(`car-dash:${id}:${setting}`, value);
}

export function appearanceFor(id: string): Appearance {
  return read(id, "appearance") === "light" ? "light" : "dark";
}

export function employeePreview(user: WorkspaceAccount) {
  return user.role === "owner" && read(user.id, "view") === "employee";
}

export function displayPermissions(user: WorkspaceAccount, permissions: string[]) {
  return employeePreview(user) ? ADMIN_DEFAULT_PERMISSIONS : permissions;
}
