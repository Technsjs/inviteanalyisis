"use client";

import { useState } from "react";
import { TimeLeft } from "@/components/time-left";
import { RedisSlotBadge, getSiteRedisLabel } from "@/components/redis-pool-panel";
import { formatExpiryShort } from "@/lib/expiry";
import { normalizeSiteUrl, siteHost } from "@/lib/url";
import type { SavedSite } from "@/lib/sites-store";

function SiteRow({
  site,
  sites,
  onOpen,
  onDelete,
}: {
  site: SavedSite;
  sites: SavedSite[];
  onOpen: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const visitUrl = normalizeSiteUrl(site.config.siteUrl);
  const redisLabel = getSiteRedisLabel(site.siteId, site.config, sites);

  return (
    <li className="border-b border-neutral-200">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 px-4 py-4 text-left active:bg-neutral-50"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[15px] font-semibold text-neutral-900">
              {site.siteId}
            </p>
            {redisLabel && (
              <RedisSlotBadge
                label={redisLabel.label}
                full={redisLabel.isFull}
              />
            )}
          </div>
          <p className="mt-0.5 truncate text-[13px] text-neutral-500">
            Expires {formatExpiryShort(site.config)}
          </p>
        </div>
        <TimeLeft config={site.config} size="list" />
      </button>

      <div className="flex items-center justify-between gap-3 px-4 pb-3">
        {visitUrl ? (
          <a
            href={visitUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="truncate text-[13px] font-medium text-neutral-900 underline underline-offset-2"
          >
            {siteHost(site.config.siteUrl)}
          </a>
        ) : (
          <span className="text-[13px] text-neutral-400">No URL</span>
        )}

        {confirmDelete ? (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => {
                onDelete();
                setConfirmDelete(false);
              }}
              className="text-[13px] font-medium text-red-500"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="text-[13px] text-neutral-500"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="shrink-0 text-[13px] text-neutral-400"
          >
            ···
          </button>
        )}
      </div>
    </li>
  );
}

export function SiteHome({
  sites,
  loading,
  setupError,
  onNew,
  onOpen,
  onDelete,
}: {
  sites: SavedSite[];
  loading: boolean;
  setupError: string | null;
  onNew: () => void;
  onOpen: (site: SavedSite) => void;
  onDelete: (siteId: string) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-lg pb-24">
      {setupError && (
        <p className="border-b border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {setupError}
        </p>
      )}

      {loading ? (
        <ul>
          {[1, 2, 3].map((i) => (
            <li
              key={i}
              className="border-b border-neutral-200 px-4 py-5"
            >
              <div className="h-4 w-32 animate-pulse rounded bg-neutral-100" />
              <div className="mt-2 h-3 w-20 animate-pulse rounded bg-neutral-100" />
            </li>
          ))}
        </ul>
      ) : sites.length === 0 ? (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
          <p className="text-[15px] text-neutral-500">No sites yet</p>
          <button
            type="button"
            onClick={onNew}
            className="mt-6 rounded-full bg-neutral-900 px-8 py-3 text-[15px] font-semibold text-white"
          >
            New site
          </button>
        </div>
      ) : (
        <ul>
          {sites.map((site) => (
            <SiteRow
              key={site.siteId}
              site={site}
              sites={sites}
              onOpen={() => onOpen(site)}
              onDelete={() => onDelete(site.siteId)}
            />
          ))}
        </ul>
      )}

      {sites.length > 0 && (
        <button
          type="button"
          onClick={onNew}
          className="fixed bottom-6 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-xl text-white shadow-md active:scale-95"
          aria-label="New site"
        >
          +
        </button>
      )}
    </div>
  );
}
