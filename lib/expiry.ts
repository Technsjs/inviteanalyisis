import type { EnvConfig } from "@/lib/env-config";

export type Countdown = {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
};

export function getExpiryDate(
  config: Pick<EnvConfig, "eventDate" | "eventTime">,
): Date | null {
  if (!config.eventDate) return null;
  const time = config.eventTime || "23:59";
  const d = new Date(`${config.eventDate}T${time}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function getCountdown(
  config: Pick<EnvConfig, "eventDate" | "eventTime">,
): Countdown | null {
  const expiry = getExpiryDate(config);
  if (!expiry) return null;

  const totalMs = expiry.getTime() - Date.now();
  if (totalMs <= 0) {
    return {
      expired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
    };
  }

  const seconds = Math.floor(totalMs / 1000);
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return { expired: false, days, hours, minutes, seconds: secs, totalMs };
}

export function timeLeftLabel(c: Countdown): string {
  if (c.expired) return "Expired";
  if (c.days > 0) return `${c.days}d left`;
  if (c.hours > 0) return `${c.hours}h left`;
  if (c.minutes > 0) return `${c.minutes}m left`;
  return `${c.seconds}s left`;
}

export function timeLeftDetailed(c: Countdown): string {
  if (c.expired) return "Expired";
  if (c.days > 0) return `${c.days}d ${c.hours}h left`;
  if (c.hours > 0) return `${c.hours}h ${c.minutes}m left`;
  return `${c.minutes}m ${c.seconds}s left`;
}

export function formatExpiryShort(
  config: Pick<EnvConfig, "eventDate" | "eventTime">,
): string {
  const expiry = getExpiryDate(config);
  if (!expiry) return "";
  return expiry.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function eventDateMs(
  config: Pick<EnvConfig, "eventDate" | "eventTime">,
): number {
  const d = getExpiryDate(config);
  return d?.getTime() ?? Number.MAX_SAFE_INTEGER;
}

export function sortSitesByEventDate<T extends { config: Pick<EnvConfig, "eventDate" | "eventTime"> }>(
  sites: T[],
): T[] {
  return [...sites].sort((a, b) => eventDateMs(a.config) - eventDateMs(b.config));
}

export function statusTone(
  c: Countdown | null,
): "ok" | "warn" | "danger" | "muted" {
  if (!c) return "muted";
  if (c.expired) return "danger";
  // ≤2 days left → red
  if (c.totalMs <= 86_400_000 * 2) return "danger";
  return "ok";
}
