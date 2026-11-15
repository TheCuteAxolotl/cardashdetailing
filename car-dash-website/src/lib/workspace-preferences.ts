import { ADMIN_DEFAULT_PERMISSIONS } from "./access-control";

export const appearances = [
  { id: "light", label: "Light", colors: ["#f7f6f2", "#ffffff", "#875f13"] },
  { id: "dark", label: "Car Dash Gold", colors: ["#131312", "#282723", "#d6b779"] },
  { id: "midnight", label: "Midnight Blue", colors: ["#080d1b", "#101f38", "#82ceff"] },
  { id: "evergreen", label: "Evergreen", colors: ["#0b1714", "#152b24", "#83ddba"] },
  { id: "amethyst", label: "Amethyst", colors: ["#151020", "#282035", "#cfafff"] },
  { id: "rose", label: "Dusty Rose", colors: ["#20131b", "#35222e", "#f5afca"] },
] as const;
export type Appearance = typeof appearances[number]["id"];
export type WorkspaceAccount = { id: string; role?: string | null };

function read(id: string, setting: string) {
  try { return localStorage.getItem(`car-dash:${id}:${setting}`); }
  catch { return null; }
}

export function savePreference(id: string, setting: "appearance" | "view", value: string) {
  localStorage.setItem(`car-dash:${id}:${setting}`, value);
}

export function appearanceFor(id: string): Appearance {
  const saved = read(id, "appearance");
  return appearances.find(theme => theme.id === saved)?.id ?? "dark";
}

export function employeePreview(user: WorkspaceAccount) {
  return user.role === "owner" && read(user.id, "view") === "employee";
}

export function displayPermissions(user: WorkspaceAccount, permissions: string[]) {
  return employeePreview(user) ? ADMIN_DEFAULT_PERMISSIONS : permissions;
}
