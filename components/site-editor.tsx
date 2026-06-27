"use client";

import { useState } from "react";
import { TimeLeft } from "@/components/time-left";
import { formatExpiryShort } from "@/lib/expiry";
import { deriveFromSiteId, type EnvConfig } from "@/lib/env-config";
import { countRedisSlots, type SavedSite } from "@/lib/sites-store";
import { normalizeSiteUrl, siteHost } from "@/lib/url";

function Field({
  label,
  value,
  onChange,
  type = "text",
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  mono?: boolean;
}) {
  return (
    <label className="block border-b border-neutral-200 py-3">
      <span className="text-[13px] text-neutral-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 w-full bg-transparent text-[15px] text-neutral-900 outline-none ${mono ? "font-mono text-[13px]" : ""}`}
      />
    </label>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-4">
      <h2 className="py-3 text-[13px] font-semibold text-neutral-900">{title}</h2>
      {children}
    </section>
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
  const redisCount = countRedisSlots(sites, config.upstashRedisUrl);
  const visitUrl = normalizeSiteUrl(config.siteUrl);

  const update = <K extends keyof EnvConfig>(key: K, value: EnvConfig[K]) => {
    const next = { ...config, [key]: value };
    if (key === "siteId" && typeof value === "string") {
      Object.assign(next, deriveFromSiteId(value));
    }
    onChange(next);
  };

  return (
    <div className="flex min-h-full flex-col bg-white">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
        <div className="flex items-center gap-2 px-2 py-2">
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center text-xl text-neutral-900"
            aria-label="Back"
          >
            ←
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold">
              {isNew ? "New site" : config.siteId}
            </p>
          </div>
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
              className="mt-2 inline-block text-[13px] font-medium text-neutral-900 underline underline-offset-2"
            >
              Visit {siteHost(config.siteUrl)} ↗
            </a>
          )}
        </div>
      </header>

      <div className="flex-1 pb-28">
        <Section title="Import">
          <textarea
            placeholder="Paste .env…"
            rows={3}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text");
              requestAnimationFrame(() => onPaste(text));
            }}
            onChange={(e) => {
              if (e.target.value.includes("=")) onPaste(e.target.value);
            }}
            className="w-full resize-none border-b border-neutral-200 bg-transparent py-3 font-mono text-[13px] outline-none"
          />
        </Section>

        <Section title="Site">
          <Field
            label="Site ID"
            value={config.siteId}
            onChange={(v) => update("siteId", v)}
          />
          <Field
            label="Expiry date"
            type="date"
            value={config.eventDate}
            onChange={(v) => update("eventDate", v)}
          />
          <Field
            label="Site URL"
            value={config.siteUrl}
            onChange={(v) => update("siteUrl", v)}
            mono
          />
        </Section>

        <Section title="Telegram">
          <Field
            label="Gmail bot token"
            value={config.telegramGmailBotToken}
            onChange={(v) => update("telegramGmailBotToken", v)}
            mono
          />
          <Field
            label="Gmail chat ID"
            value={config.telegramGmailChatId}
            onChange={(v) => update("telegramGmailChatId", v)}
          />
          <Field
            label="Other bot token"
            value={config.telegramOtherBotToken}
            onChange={(v) => update("telegramOtherBotToken", v)}
            mono
          />
          <Field
            label="Other chat ID"
            value={config.telegramOtherChatId}
            onChange={(v) => update("telegramOtherChatId", v)}
          />
          <Field
            label="Webhook secret"
            value={config.telegramWebhookSecret}
            onChange={(v) => update("telegramWebhookSecret", v)}
            mono
          />
        </Section>

        <Section title={`Redis · ${redisCount}/5`}>
          <Field
            label="Redis URL"
            value={config.upstashRedisUrl}
            onChange={(v) => update("upstashRedisUrl", v)}
            mono
          />
          <Field
            label="Redis token"
            value={config.upstashRedisToken}
            onChange={(v) => update("upstashRedisToken", v)}
            mono
          />
        </Section>

        <section className="px-4">
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="w-full border-b border-neutral-200 py-3 text-left text-[13px] text-neutral-500"
          >
            {showMore ? "Hide advanced" : "Advanced"}
          </button>
          {showMore && (
            <>
              <Field
                label="Event time"
                type="time"
                value={config.eventTime}
                onChange={(v) => update("eventTime", v)}
              />
              <Field
                label="Timezone"
                value={config.eventTimezone}
                onChange={(v) => update("eventTimezone", v)}
              />
              <Field
                label="Session cookie"
                value={config.sessionCookieName}
                onChange={(v) => update("sessionCookieName", v)}
              />
              <Field
                label="Consent cookie"
                value={config.consentCookieName}
                onChange={(v) => update("consentCookieName", v)}
              />
              <Field
                label="Admin API key"
                value={config.adminApiKey}
                onChange={(v) => update("adminApiKey", v)}
                mono
              />
            </>
          )}
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-lg gap-2 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex-1 rounded-full bg-neutral-900 py-3 text-[15px] font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onCopy}
            className="rounded-full border border-neutral-300 px-5 py-3 text-[15px] font-semibold text-neutral-900"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}
