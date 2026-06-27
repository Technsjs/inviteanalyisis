"use client";

import { TimeLeft } from "@/components/time-left";
import { getSiteRedisLabel } from "@/components/redis-pool-panel";
import { formatExpiryShort } from "@/lib/expiry";
import type { EnvConfig } from "@/lib/env-config";
import type { SavedSite } from "@/lib/sites-store";
import { normalizeSiteUrl, siteHost } from "@/lib/url";

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="border-b border-neutral-200 py-3">
      <p className="text-[13px] text-neutral-500">{label}</p>
      <p
        className={`mt-1 break-all text-[15px] text-neutral-900 ${mono ? "font-mono text-[13px]" : ""}`}
      >
        {value || "—"}
      </p>
    </div>
  );
}

export function SiteView({
  config,
  sites,
  onBack,
  onEdit,
  onCopy,
  onRenew,
}: {
  config: EnvConfig;
  sites: SavedSite[];
  onBack: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onRenew: () => void;
}) {
  const visitUrl = normalizeSiteUrl(config.siteUrl);
  const redisLabel = getSiteRedisLabel(config.siteId, config, sites);

  return (
    <div className="flex min-h-full flex-col bg-white">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
        <div className="flex items-center gap-2 px-2 py-2">
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center text-xl"
            aria-label="Back"
          >
            ←
          </button>
          <p className="min-w-0 flex-1 truncate text-[15px] font-semibold">
            {config.siteId}
          </p>
          <button
            type="button"
            onClick={onEdit}
            className="px-3 py-2 text-[15px] font-semibold text-neutral-900"
          >
            Edit
          </button>
        </div>

        <div className="border-t border-neutral-100 px-4 pb-4 pt-3">
          <TimeLeft config={config} size="hero" />
          <p className="mt-1 text-[13px] text-neutral-500">
            Expires {formatExpiryShort(config)}
            {config.eventTime ? ` · ${config.eventTime}` : ""}
          </p>
          {visitUrl && (
            <a
              href={visitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-[13px] font-medium underline underline-offset-2"
            >
              Visit {siteHost(config.siteUrl)} ↗
            </a>
          )}
        </div>
      </header>

      <div className="flex-1 px-4 pb-28">
        <Row label="Site ID" value={config.siteId} />
        <Row label="Site URL" value={config.siteUrl} mono />
        <Row label="Webhook secret" value={config.telegramWebhookSecret} mono />
        <Row
          label="Expiry"
          value={`${config.eventDate}${config.eventTime ? ` · ${config.eventTime}` : ""}`}
        />
        <Row label="Timezone" value={config.eventTimezone} />
        <Row
          label="Telegram"
          value={
            config.telegramGmailChatId ? "Configured" : "Not set"
          }
        />
        <Row
          label="Redis slot"
          value={
            redisLabel
              ? `${redisLabel.label} · ${redisLabel.usage}/${redisLabel.max} on Redis ${redisLabel.poolNumber}`
              : "Not set"
          }
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-lg gap-2 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onCopy}
            className="flex-1 rounded-full bg-neutral-900 py-3 text-[15px] font-semibold text-white"
          >
            Copy .env
          </button>
          <button
            type="button"
            onClick={onRenew}
            className="rounded-full border border-neutral-300 px-5 py-3 text-[15px] font-semibold"
          >
            Renew
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-full border border-neutral-300 px-5 py-3 text-[15px] font-semibold"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
