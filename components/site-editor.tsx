"use client";

import { useState } from "react";
import { CountdownBadge } from "@/components/countdown";
import { formatExpiryLabel } from "@/lib/expiry";
import {
  deriveFromSiteId,
  type EnvConfig,
} from "@/lib/env-config";
import { countRedisSlots, type SavedSite } from "@/lib/sites-store";

function Input({
  label,
  value,
  onChange,
  type = "text",
  mono,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  mono?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-600">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-3 text-base text-zinc-900 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 sm:text-sm ${mono ? "font-mono text-xs" : ""}`}
      />
      {hint && (
        <span className="mt-1 block text-[11px] text-zinc-400">{hint}</span>
      )}
    </label>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
      <header className="mb-4">
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>
        )}
      </header>
      {children}
    </section>
  );
}

function RedisMeter({ used, max = 5 }: { used: number; max?: number }) {
  const pct = Math.min(100, (used / max) * 100);
  const full = used >= max;
  return (
    <div className="rounded-xl bg-zinc-50 p-3">
      <div className="mb-2 flex justify-between text-xs">
        <span className="font-medium text-zinc-600">Redis pool</span>
        <span className={full ? "font-semibold text-amber-600" : "text-zinc-500"}>
          {used}/{max}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
        <div
          className={`h-full rounded-full ${full ? "bg-amber-500" : "bg-indigo-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function SiteEditor({
  config,
  sites,
  isNew,
  saving,
  onBack,
  onChange,
  onSave,
  onCopy,
  onPaste,
}: {
  config: EnvConfig;
  sites: SavedSite[];
  isNew: boolean;
  saving: boolean;
  onBack: () => void;
  onChange: (config: EnvConfig) => void;
  onSave: () => void;
  onCopy: () => void;
  onPaste: (text: string) => void;
}) {
  const [showMore, setShowMore] = useState(false);
  const [pasteFocused, setPasteFocused] = useState(false);
  const redisCount = countRedisSlots(sites, config.upstashRedisUrl);

  const update = <K extends keyof EnvConfig>(key: K, value: EnvConfig[K]) => {
    const next = { ...config, [key]: value };
    if (key === "siteId" && typeof value === "string") {
      Object.assign(next, deriveFromSiteId(value));
    }
    onChange(next);
  };

  return (
    <div className="flex min-h-full flex-col">
      {/* Mobile header with back */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3 sm:max-w-2xl sm:px-6">
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-lg text-zinc-700 active:bg-zinc-50"
            aria-label="Back to sites"
          >
            ←
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-900">
              {isNew ? "New site" : config.siteId}
            </p>
            <p className="truncate text-xs text-zinc-500">
              {formatExpiryLabel(config)}
            </p>
          </div>
          <CountdownBadge config={config} large />
        </div>
      </header>

      <div className="mx-auto w-full max-w-lg flex-1 space-y-4 px-4 py-4 pb-32 sm:max-w-2xl sm:px-6 sm:py-6">
        <Card title="Import" subtitle="Paste .env to auto-fill">
          <div
            className={`rounded-xl border-2 border-dashed transition ${
              pasteFocused
                ? "border-indigo-400 bg-indigo-50/30"
                : "border-zinc-200 bg-zinc-50/50"
            }`}
          >
            <textarea
              placeholder="SITE_ID=...&#10;NEXT_PUBLIC_SITE_URL=..."
              rows={4}
              onFocus={() => setPasteFocused(true)}
              onBlur={() => setPasteFocused(false)}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                requestAnimationFrame(() => onPaste(text));
              }}
              onChange={(e) => {
                if (e.target.value.includes("=")) onPaste(e.target.value);
              }}
              className="w-full resize-none bg-transparent px-4 py-3 font-mono text-xs outline-none"
            />
          </div>
        </Card>

        <Card title="Site" subtitle="Per-customer fields">
          <div className="space-y-4">
            <Input
              label="Site ID"
              value={config.siteId}
              onChange={(v) => update("siteId", v)}
              hint="Auto-fills URL & webhook"
            />
            <Input
              label="Expiry / event date"
              type="date"
              value={config.eventDate}
              onChange={(v) => update("eventDate", v)}
            />
            <Input
              label="Site URL"
              value={config.siteUrl}
              onChange={(v) => update("siteUrl", v)}
              mono
            />
          </div>
        </Card>

        <Card title="Telegram">
          <div className="space-y-4">
            <Input
              label="Gmail bot token"
              value={config.telegramGmailBotToken}
              onChange={(v) => update("telegramGmailBotToken", v)}
              mono
            />
            <Input
              label="Gmail chat ID"
              value={config.telegramGmailChatId}
              onChange={(v) => update("telegramGmailChatId", v)}
            />
            <Input
              label="Other bot token"
              value={config.telegramOtherBotToken}
              onChange={(v) => update("telegramOtherBotToken", v)}
              mono
            />
            <Input
              label="Other chat ID"
              value={config.telegramOtherChatId}
              onChange={(v) => update("telegramOtherChatId", v)}
            />
            <Input
              label="Webhook secret"
              value={config.telegramWebhookSecret}
              onChange={(v) => update("telegramWebhookSecret", v)}
              mono
            />
          </div>
        </Card>

        <Card title="Redis" subtitle="Max 5 sites per instance">
          <div className="space-y-4">
            <RedisMeter used={redisCount} />
            <Input
              label="Redis URL"
              value={config.upstashRedisUrl}
              onChange={(v) => update("upstashRedisUrl", v)}
              mono
            />
            <Input
              label="Redis token"
              value={config.upstashRedisToken}
              onChange={(v) => update("upstashRedisToken", v)}
              mono
            />
          </div>
        </Card>

        <Card title="Advanced">
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="flex w-full items-center justify-between text-sm text-zinc-600"
          >
            <span>{showMore ? "Hide" : "Show"} extra fields</span>
            <span className={showMore ? "rotate-180" : ""}>▾</span>
          </button>
          {showMore && (
            <div className="mt-4 space-y-4 border-t border-zinc-100 pt-4">
              <Input
                label="Event time"
                type="time"
                value={config.eventTime}
                onChange={(v) => update("eventTime", v)}
              />
              <Input
                label="Timezone"
                value={config.eventTimezone}
                onChange={(v) => update("eventTimezone", v)}
              />
              <Input
                label="Session cookie"
                value={config.sessionCookieName}
                onChange={(v) => update("sessionCookieName", v)}
              />
              <Input
                label="Consent cookie"
                value={config.consentCookieName}
                onChange={(v) => update("consentCookieName", v)}
              />
              <Input
                label="Admin API key"
                value={config.adminApiKey}
                onChange={(v) => update("adminApiKey", v)}
                mono
              />
            </div>
          )}
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:max-w-2xl sm:px-6">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex-1 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onCopy}
            className="flex-1 rounded-xl border border-zinc-200 py-3.5 text-sm font-semibold text-zinc-800"
          >
            Copy .env
          </button>
        </div>
      </div>
    </div>
  );
}
