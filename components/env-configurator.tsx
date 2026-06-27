"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SiteEditor } from "@/components/site-editor";
import { SiteHome } from "@/components/site-home";
import { SiteView } from "@/components/site-view";
import { RenewModal } from "@/components/renew-modal";
import {
  DEFAULT_ENV,
  mergeEnvConfig,
  parseEnvText,
  serializeEnv,
  type EnvConfig,
} from "@/lib/env-config";
import {
  listSites,
  saveSite,
  type SavedSite,
} from "@/lib/sites-store";
import { isPoolFullForSite } from "@/lib/redis-pool";

type Screen = "home" | "view" | "edit";

export function EnvConfigurator() {
  const [screen, setScreen] = useState<Screen>("home");
  const [config, setConfig] = useState<EnvConfig>(DEFAULT_ENV);
  const [isNew, setIsNew] = useState(true);
  const [sites, setSites] = useState<SavedSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [redisOverride, setRedisOverride] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);

  const output = useMemo(() => serializeEnv(config), [config]);

  const notify = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setSites(await listSites());
      setSetupError(null);
    } catch (e) {
      setSetupError(e instanceof Error ? e.message : "Could not load sites");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openNew = () => {
    setConfig(DEFAULT_ENV);
    setIsNew(true);
    setRedisOverride(false);
    setScreen("edit");
  };

  const openSite = (site: SavedSite) => {
    setConfig(site.config);
    setIsNew(false);
    setScreen("view");
  };

  const applyPaste = (text: string) => {
    const parsed = parseEnvText(text);
    if (Object.keys(parsed).length === 0) return;
    // Paste is source of truth — keep URL & webhook from .env as pasted
    setConfig(mergeEnvConfig(parsed));
    notify("Imported");
  };

  const handleSave = async () => {
    if (!config.siteId.trim()) {
      notify("Site ID required");
      return;
    }
    const poolFull = isPoolFullForSite(sites, config, config.siteId, isNew);
    if (poolFull && !redisOverride) {
      notify("Redis full — change Redis or enable override");
      return;
    }
    setSaving(true);
    try {
      await saveSite(config);
      await refresh();
      setIsNew(false);
      notify("Saved");
      setScreen("view");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    notify("Copied");
  };

  const handleRenew = async (eventDate: string) => {
    const updated = { ...config, eventDate };
    setSaving(true);
    try {
      await saveSite(updated);
      setConfig(updated);
      await refresh();
      setRenewOpen(false);
      notify("Renewed");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Renew failed");
    } finally {
      setSaving(false);
    }
  };

  const backFromEdit = () => {
    setScreen(isNew ? "home" : "view");
  };

  return (
    <div className="min-h-full bg-white">
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-neutral-900 px-4 py-2 text-[13px] font-medium text-white">
          {toast}
        </div>
      )}

      {screen === "home" && (
        <>
          <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
            <div className="mx-auto max-w-lg px-4 py-4">
              <h1 className="text-[17px] font-semibold">Sites</h1>
            </div>
          </header>
          <SiteHome
            sites={sites}
            loading={loading}
            setupError={setupError}
            onNew={openNew}
            onOpen={openSite}
          />
        </>
      )}

      {screen === "view" && (
        <>
          <SiteView
            config={config}
            sites={sites}
            onBack={() => setScreen("home")}
            onEdit={() => {
              setRedisOverride(false);
              setScreen("edit");
            }}
            onCopy={handleCopy}
            onRenew={() => setRenewOpen(true)}
          />
          {renewOpen && (
            <RenewModal
              siteId={config.siteId}
              currentDate={config.eventDate}
              currentTime={config.eventTime}
              saving={saving}
              onClose={() => setRenewOpen(false)}
              onConfirm={handleRenew}
            />
          )}
        </>
      )}

      {screen === "edit" && (
        <SiteEditor
          config={config}
          sites={sites}
          isNew={isNew}
          saving={saving}
          onBack={backFromEdit}
          onChange={setConfig}
          onSave={handleSave}
          onPaste={applyPaste}
          redisOverride={redisOverride}
          onRedisOverrideChange={setRedisOverride}
        />
      )}
    </div>
  );
}
