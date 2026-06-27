"use client";

import { useEffect, useState } from "react";
import {
  countdownText,
  getCountdown,
  statusTone,
  type Countdown,
} from "@/lib/expiry";
import type { EnvConfig } from "@/lib/env-config";

const toneClass = {
  ok: "text-emerald-600 bg-emerald-50",
  warn: "text-amber-700 bg-amber-50",
  danger: "text-red-600 bg-red-50",
  muted: "text-zinc-500 bg-zinc-100",
};

export function CountdownBadge({
  config,
  large,
}: {
  config: Pick<EnvConfig, "eventDate" | "eventTime">;
  large?: boolean;
}) {
  const [cd, setCd] = useState<Countdown | null>(() => getCountdown(config));

  useEffect(() => {
    setCd(getCountdown(config));
    const id = setInterval(() => setCd(getCountdown(config)), 1000);
    return () => clearInterval(id);
  }, [config.eventDate, config.eventTime]);

  if (!cd) return null;
  const tone = statusTone(cd);

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium tabular-nums ${toneClass[tone]} ${large ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-xs"}`}
    >
      {countdownText(cd)}
    </span>
  );
}
