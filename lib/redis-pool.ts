import type { EnvConfig } from "@/lib/env-config";
import type { SavedSite } from "@/lib/sites-store";

export const REDIS_MAX_PER_POOL = 5;
const SLOT_LETTERS = ["a", "b", "c", "d", "e"] as const;

export type RedisPoolInfo = {
  poolKey: string;
  poolNumber: number;
  url: string;
  sites: SavedSite[];
};

export type SiteRedisLabel = {
  label: string;
  poolNumber: number;
  slotIndex: number;
  poolKey: string;
  usage: number;
  max: number;
  isFull: boolean;
};

export type PoolSlot = {
  siteId: string;
  slot: string;
  eventDate: string;
};

export function redisPoolKey(url: string, token: string): string {
  return `${url.trim()}|${token.trim()}`;
}

function expiryMs(config: Pick<EnvConfig, "eventDate" | "eventTime">): number {
  const date = config.eventDate || "9999-12-31";
  const time = config.eventTime || "23:59";
  const ms = new Date(`${date}T${time}:00`).getTime();
  return Number.isNaN(ms) ? Number.MAX_SAFE_INTEGER : ms;
}

function sortByExpiry(sites: SavedSite[]): SavedSite[] {
  return [...sites].sort(
    (a, b) => expiryMs(a.config) - expiryMs(b.config),
  );
}

/** All Redis pools — numbered 1, 2, 3… by first site added (updatedAt). */
export function buildRedisPools(sites: SavedSite[]): Map<string, RedisPoolInfo> {
  const raw = new Map<string, { url: string; sites: SavedSite[] }>();

  for (const site of sites) {
    const url = site.config.upstashRedisUrl?.trim();
    if (!url) continue;
    const key = redisPoolKey(url, site.config.upstashRedisToken);
    const entry = raw.get(key) ?? { url, sites: [] };
    entry.sites.push(site);
    raw.set(key, entry);
  }

  const ordered = [...raw.entries()]
    .map(([key, { url, sites: poolSites }]) => {
      const firstUsed = Math.min(
        ...poolSites.map(
          (s) => s.updatedAt?.getTime() ?? expiryMs(s.config),
        ),
      );
      return { key, url, sites: sortByExpiry(poolSites), firstUsed };
    })
    .sort((a, b) => a.firstUsed - b.firstUsed);

  const result = new Map<string, RedisPoolInfo>();
  ordered.forEach((p, i) => {
    result.set(p.key, {
      poolKey: p.key,
      poolNumber: i + 1,
      url: p.url,
      sites: p.sites,
    });
  });
  return result;
}

function slotLetter(index: number): string {
  return SLOT_LETTERS[index] ?? "?";
}

/** Slot label for one site — pool# + letter by expiry order (1a, 1b, 2a…). */
export function getSiteRedisLabel(
  siteId: string,
  config: Pick<EnvConfig, "upstashRedisUrl" | "upstashRedisToken" | "eventDate" | "eventTime">,
  allSites: SavedSite[],
): SiteRedisLabel | null {
  const url = config.upstashRedisUrl?.trim();
  if (!url) return null;

  const key = redisPoolKey(url, config.upstashRedisToken);
  const pools = buildRedisPools(allSites);
  const pool = pools.get(key);
  if (!pool) return null;

  const sorted = sortByExpiry(pool.sites);
  let slotIndex = sorted.findIndex((s) => s.siteId === siteId);

  if (slotIndex === -1) {
    const thisExpiry = expiryMs(config);
    slotIndex = sorted.findIndex((s) => expiryMs(s.config) > thisExpiry);
    if (slotIndex === -1) slotIndex = sorted.length;
  }

  return {
    label: `${pool.poolNumber}${slotLetter(slotIndex)}`,
    poolNumber: pool.poolNumber,
    slotIndex,
    poolKey: key,
    usage: pool.sites.length,
    max: REDIS_MAX_PER_POOL,
    isFull: pool.sites.length >= REDIS_MAX_PER_POOL,
  };
}

/** Label preview while editing (includes unsaved site in pool). */
export function getRedisLabelForConfig(
  siteId: string,
  config: EnvConfig,
  allSites: SavedSite[],
): SiteRedisLabel | null {
  const others = allSites.filter((s) => s.siteId !== siteId);
  const merged: SavedSite[] = [
    ...others,
    { siteId, config, updatedAt: new Date() },
  ];
  return getSiteRedisLabel(siteId, config, merged);
}

export function getPoolUsage(
  sites: SavedSite[],
  url: string,
  token: string,
  excludeSiteId?: string,
): number {
  if (!url.trim()) return 0;
  const key = redisPoolKey(url, token);
  return sites.filter(
    (s) =>
      redisPoolKey(s.config.upstashRedisUrl, s.config.upstashRedisToken) ===
        key && s.siteId !== excludeSiteId,
  ).length;
}

export function isPoolFullForSite(
  sites: SavedSite[],
  config: EnvConfig,
  siteId: string,
  isNew: boolean,
): boolean {
  const url = config.upstashRedisUrl;
  const token = config.upstashRedisToken;
  if (!url?.trim()) return false;

  const key = redisPoolKey(url, token);
  const existing = sites.find((s) => s.siteId === siteId);
  const samePool =
    existing &&
    redisPoolKey(
      existing.config.upstashRedisUrl,
      existing.config.upstashRedisToken,
    ) === key;

  if (!isNew && samePool) return false;

  const usage = getPoolUsage(sites, url, token, isNew ? undefined : siteId);
  return usage >= REDIS_MAX_PER_POOL;
}

export function getPoolSlots(
  url: string,
  token: string,
  allSites: SavedSite[],
): PoolSlot[] {
  const key = redisPoolKey(url, token);
  const pools = buildRedisPools(allSites);
  const pool = pools.get(key);
  if (!pool) return [];

  return pool.sites.map((s, i) => ({
    siteId: s.siteId,
    slot: `${pool.poolNumber}${slotLetter(i)}`,
    eventDate: s.config.eventDate,
  }));
}

export function listPoolSummaries(sites: SavedSite[]) {
  return [...buildRedisPools(sites).values()].map((pool) => ({
    poolNumber: pool.poolNumber,
    usage: pool.sites.length,
    max: REDIS_MAX_PER_POOL,
    isFull: pool.sites.length >= REDIS_MAX_PER_POOL,
    url: pool.url,
    slots: pool.sites.map((s, i) => ({
      siteId: s.siteId,
      slot: `${pool.poolNumber}${slotLetter(i)}`,
      eventDate: s.config.eventDate,
    })),
  }));
}

/** @deprecated use getPoolUsage */
export function countRedisSlots(sites: SavedSite[], redisUrl: string): number {
  return sites.filter((s) => s.config.upstashRedisUrl === redisUrl).length;
}
