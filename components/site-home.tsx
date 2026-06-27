"use client";

import { CountdownBadge } from "@/components/countdown";
import { formatExpiryLabel, getCountdown, statusTone } from "@/lib/expiry";
import type { SavedSite } from "@/lib/sites-store";

function SiteCard({
  site,
  onOpen,
  onDelete,
}: {
  site: SavedSite;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const cd = getCountdown(site.config);
  const tone = statusTone(cd);
  const ring =
    tone === "danger"
      ? "border-red-200"
      : tone === "warn"
        ? "border-amber-200"
        : "border-zinc-200";

  return (
    <article
      className={`rounded-2xl border bg-white p-4 shadow-sm active:scale-[0.99] transition ${ring}`}
    >
      <button type="button" onClick={onOpen} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold text-zinc-900">
              {site.siteId}
            </h2>
            <p className="mt-1 truncate text-xs text-zinc-500">
              {site.config.siteUrl.replace(/^https?:\/\//, "")}
            </p>
          </div>
          <CountdownBadge config={site.config} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-zinc-50 px-3 py-2">
            <p className="text-zinc-400">Expires</p>
            <p className="mt-0.5 font-medium text-zinc-700">
              {formatExpiryLabel(site.config)}
            </p>
          </div>
          <div className="rounded-xl bg-zinc-50 px-3 py-2">
            <p className="text-zinc-400">Telegram</p>
            <p className="mt-0.5 font-medium text-zinc-700">
              {site.config.telegramGmailChatId ? "Configured" : "Missing"}
            </p>
          </div>
        </div>
      </button>

      <div className="mt-3 flex gap-2 border-t border-zinc-100 pt-3">
        <button
          type="button"
          onClick={onOpen}
          className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white"
        >
          Open
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-500"
        >
          Delete
        </button>
      </div>
    </article>
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
    <div className="mx-auto w-full max-w-lg px-4 pb-28 pt-4 sm:max-w-2xl sm:px-6 sm:pt-6">
      {setupError && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <p className="font-semibold">Firebase not connected</p>
          <p className="mt-1">{setupError}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : sites.length === 0 ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
            +
          </div>
          <h2 className="mt-4 text-lg font-semibold text-zinc-900">No sites yet</h2>
          <p className="mt-2 max-w-xs text-sm text-zinc-500">
            Create a new invite site config, paste your .env, and save it here.
          </p>
          <button
            type="button"
            onClick={onNew}
            className="mt-6 w-full max-w-xs rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-sm"
          >
            New site
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                Your sites
              </p>
              <p className="text-2xl font-semibold text-zinc-900">{sites.length}</p>
            </div>
          </div>
          <ul className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
            {sites.map((site) => (
              <li key={site.siteId}>
                <SiteCard
                  site={site}
                  onOpen={() => onOpen(site)}
                  onDelete={() => onDelete(site.siteId)}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {sites.length > 0 && (
        <button
          type="button"
          onClick={onNew}
          className="fixed bottom-6 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-2xl text-white shadow-lg shadow-indigo-600/30 active:scale-95 sm:right-8"
          aria-label="New site"
        >
          +
        </button>
      )}
    </div>
  );
}
