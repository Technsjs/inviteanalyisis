"use client";

import { useEffect, useState } from "react";
import {
  getCountdown,
  statusTone,
  timeLeftDetailed,
  timeLeftLabel,
  type Countdown,
} from "@/lib/expiry";
import type { EnvConfig } from "@/lib/env-config";

const toneText = {
  ok: "text-neutral-900",
  warn: "text-amber-600",
  danger: "text-red-500",
  muted: "text-neutral-400",
};

type Props = {
  config: Pick<EnvConfig, "eventDate" | "eventTime">;
  size?: "list" | "header" | "hero";
};

/** Live countdown for a single site — pass that site's eventDate/eventTime. */
export function TimeLeft({ config, size = "list" }: Props) {
  const [cd, setCd] = useState<Countdown | null>(() => getCountdown(config));

  useEffect(() => {
    setCd(getCountdown(config));
    const id = setInterval(() => setCd(getCountdown(config)), 1000);
    return () => clearInterval(id);
  }, [config.eventDate, config.eventTime]);

  if (!cd) {
    return <span className="text-neutral-400">—</span>;
  }

  const tone = statusTone(cd);
  const color = toneText[tone];

  if (size === "hero") {
    return (
      <p className={`text-3xl font-semibold tracking-tight tabular-nums ${color}`}>
        {timeLeftDetailed(cd)}
      </p>
    );
  }

  if (size === "header") {
    return (
      <p className={`text-sm font-medium tabular-nums ${color}`}>
        {timeLeftDetailed(cd)}
      </p>
    );
  }

  return (
    <span className={`shrink-0 text-sm font-medium tabular-nums ${color}`}>
      {timeLeftLabel(cd)}
    </span>
  );
}
