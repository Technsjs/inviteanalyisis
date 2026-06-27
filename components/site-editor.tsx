"use client";

import { useState } from "react";
import { formatExpiryShort } from "@/lib/expiry";
import { deriveFromSiteId, withSiteIdDerivations, type EnvConfig } from "@/lib/env-config";
import { RedisPoolPanel } from "@/components/redis-pool-panel";
import type { SavedSite } from "@/lib/sites-store";

function Field({
  label,
  value,
  onChange,
  type = "text",
  mono,
  auto,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  mono?: boolean;
  auto?: boolean;
  readOnly?: boolean;
}) {
  return (
    <label className="block border-b border-neutral-200 py-3">
      <span className="flex items-center gap-2 text-[13px] text-neutral-500">
        {label}
        {auto && (
          <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500">
            auto
          </span>
        )}
      </span>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className={`mt-1 w-full bg-transparent text-[15px] text-neutral-900 outline-none ${mono ? "font-mono text-[13px]" : ""} ${readOnly ? "text-neutral-500" : ""}`}
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
  onPaste,
  redisOverride,
  onRedisOverrideChange,
}: {
  config: EnvConfig;
  sites: SavedSite[];
  isNew: boolean;
  saving: boolean;
  onBack: () => void;
  onChange: (config: EnvConfig) => void;
  onSave: () => void;
  onPaste: (text: string) => void;
  redisOverride: boolean;
  onRedisOverrideChange: (v: boolean) => void;
}) {
  const [showMore, setShowMore] = useState(false);

  const update = <K extends keyof EnvConfig>(key: K, value: EnvConfig[K]) => {
    let next = { ...config, [key]: value };
    if (key === "siteId" && typeof value === "string") {
      next = withSiteIdDerivations(next);
    }
    onChange(next);
  };

  const derived = deriveFromSiteId(config.siteId);

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
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold">
              {isNew ? "New site" : `Edit ${config.siteId}`}
            </p>
            {!isNew && (
              <p className="text-[13px] text-neutral-500">
                Expires {formatExpiryShort(config)}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 pb-28">
        <Section title="Import">
          <p className="mb-2 text-[13px] text-neutral-500">
            Paste full .env — or edit fields below
          </p>
          <textarea
            placeholder="SITE_ID=invitey-nine&#10;NEXT_PUBLIC_SITE_URL=..."
            rows={4}
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
            label="Site URL"
            value={config.siteUrl}
            onChange={(v) => update("siteUrl", v)}
            mono
            auto
          />
          {config.siteUrl !== derived.siteUrl && config.siteId && (
            <p className="py-1 text-[11px] text-amber-600">
              Auto would be: {derived.siteUrl}
            </p>
          )}
          <Field
            label="Expiry date"
            type="date"
            value={config.eventDate}
            onChange={(v) => update("eventDate", v)}
          />
          <Field
            label="Webhook secret"
            value={config.telegramWebhookSecret}
            onChange={(v) => update("telegramWebhookSecret", v)}
            mono
            auto
          />
          {config.telegramWebhookSecret !== derived.telegramWebhookSecret &&
            config.siteId && (
              <p className="py-1 text-[11px] text-amber-600">
                Auto would be: {derived.telegramWebhookSecret}
              </p>
            )}
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
        </Section>

        <Section title="Redis">
          <RedisPoolPanel
            siteId={config.siteId}
            config={config}
            sites={sites}
            isNew={isNew}
            override={redisOverride}
            onOverrideChange={onRedisOverrideChange}
          />
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
        <div className="mx-auto flex max-w-lg px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="w-full rounded-full bg-neutral-900 py-3 text-[15px] font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
