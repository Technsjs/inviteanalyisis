import type { EnvConfig } from "@/lib/env-config";

export type SavedSite = {
  siteId: string;
  config: EnvConfig;
  updatedAt: Date | null;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export async function listSites(): Promise<SavedSite[]> {
  const data = await api<{ sites: Array<Omit<SavedSite, "updatedAt"> & { updatedAt: string | null }> }>("/api/sites");
  return data.sites.map((s) => ({
    ...s,
    updatedAt: s.updatedAt ? new Date(s.updatedAt) : null,
  }));
}

export async function saveSite(config: EnvConfig): Promise<void> {
  await api("/api/sites", {
    method: "POST",
    body: JSON.stringify({ config }),
  });
}

export async function deleteSite(siteId: string): Promise<void> {
  await api(`/api/sites/${encodeURIComponent(siteId)}`, { method: "DELETE" });
}

export function countRedisSlots(sites: SavedSite[], redisUrl: string): number {
  if (!redisUrl) return 0;
  return sites.filter((s) => s.config.upstashRedisUrl === redisUrl).length;
}
