"use client";

import {
  getPoolSlots,
  getRedisLabelForConfig,
  getSiteRedisLabel,
  isPoolFullForSite,
  listPoolSummaries,
  REDIS_MAX_PER_POOL,
} from "@/lib/redis-pool";
import type { EnvConfig } from "@/lib/env-config";
import type { SavedSite } from "@/lib/sites-store";

export function RedisSlotBadge({
  label,
  full,
}: {
  label: string;
  full?: boolean;
}) {
  return (
    <span
      className={`shrink-0 rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold ${
        full ? "bg-red-100 text-red-700" : "bg-neutral-100 text-neutral-700"
      }`}
    >
      {label}
    </span>
  );
}

export function RedisPoolPanel({
  siteId,
  config,
  sites,
  isNew,
  override,
  onOverrideChange,
}: {
  siteId: string;
  config: EnvConfig;
  sites: SavedSite[];
  isNew: boolean;
  override: boolean;
  onOverrideChange: (v: boolean) => void;
}) {
  const label = getRedisLabelForConfig(siteId, config, sites);
  const full = isPoolFullForSite(sites, config, siteId, isNew);
  const slots = getPoolSlots(
    config.upstashRedisUrl,
    config.upstashRedisToken,
    sites.filter((s) => s.siteId !== siteId),
  );
  const allPools = listPoolSummaries(sites);

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2.5">
          <span className="text-[13px] text-neutral-600">Your slot</span>
          <RedisSlotBadge label={label.label} full={full && !override} />
        </div>
      )}

      {slots.length > 0 && (
        <div className="rounded-lg border border-neutral-200 px-3 py-2">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
            On this Redis ({label?.poolNumber ?? "?"})
          </p>
          <ul className="space-y-1.5">
            {slots.map((s) => (
              <li
                key={s.siteId}
                className="flex items-center justify-between text-[13px]"
              >
                <span className="font-mono text-neutral-500">{s.slot}</span>
                <span className="truncate px-2 text-neutral-900">{s.siteId}</span>
                <span className="shrink-0 text-neutral-400">{s.eventDate}</span>
              </li>
            ))}
            {label && isNew && (
              <li className="flex items-center justify-between border-t border-neutral-100 pt-1.5 text-[13px] text-neutral-500">
                <span className="font-mono">{label.label}</span>
                <span className="truncate px-2">{siteId || "new"}</span>
                <span className="shrink-0">{config.eventDate}</span>
              </li>
            )}
          </ul>
          <p className="mt-2 text-[11px] text-neutral-400">
            Slots ordered by expiry date (earliest = a)
          </p>
        </div>
      )}

      {allPools.length > 1 && (
        <div className="text-[12px] text-neutral-500">
          {allPools.map((p) => (
            <span key={p.poolNumber} className="mr-3">
              Redis {p.poolNumber}: {p.usage}/{p.max}
              {p.isFull ? " full" : ""}
            </span>
          ))}
        </div>
      )}

      {full && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-3">
          <p className="text-[13px] font-medium text-amber-900">
            Redis {label?.poolNumber} is full ({REDIS_MAX_PER_POOL}/
            {REDIS_MAX_PER_POOL})
          </p>
          <p className="mt-1 text-[12px] text-amber-800">
            Create a new Upstash instance and paste new URL + token, or override
            below.
          </p>
          <label className="mt-3 flex items-center gap-2">
            <input
              type="checkbox"
              checked={override}
              onChange={(e) => onOverrideChange(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            <span className="text-[13px] text-amber-900">
              Override — save anyway (6th site)
            </span>
          </label>
        </div>
      )}
    </div>
  );
}

export { getSiteRedisLabel };
