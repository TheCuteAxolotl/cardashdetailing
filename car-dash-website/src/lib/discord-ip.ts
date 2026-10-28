import { isIP } from "node:net";

export function discordIpLine(ip?: string | null, source = "SMS provider") {
  const value = ip?.trim() || "";
  return isIP(value)
    ? `IP address (public): ${value}`
    : `IP address: Unavailable (${source} does not provide a customer IP)`;
}
