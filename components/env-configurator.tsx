"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SiteEditor } from "@/components/site-editor";
import { SiteHome } from "@/components/site-home";
import {
  DEFAULT_ENV,
  mergeEnvConfig,
  parseEnvText,
  serializeEnv,
  type EnvConfig,
} from "@/lib/env-config";
import {
  deleteSite,
  listSites,
  saveSite,
  type SavedSite,
} from "@/lib/sites-store";

type Screen = "home" | "editor";

export function EnvConfigurator() {
  const [screen, setScreen] = useState<Screen>("home");
  const [config, setConfig] = useState<EnvConfig>(DEFAULT_ENV);
  const [isNew, setIsNew] = useState(true);
  const [sites, setSites] = useState<SavedSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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
    setScreen("editor");
  };

  const openSite = (site: SavedSite) => {
    setConfig(site.config);
    setIsNew(false);
    setScreen("editor");
  };

  const applyPaste = (text: string) => {
    const parsed = parseEnvText(text);
    if (Object.keys(parsed).length === 0) return;
    setConfig(mergeEnvConfig(parsed));
    notify("Imported");
  };

  const handleSave = async () => {
    if (!config.siteId.trim()) {
      notify("Site ID required");
      return;
    }
    setSaving(true);
    try {
      await saveSite(config);
      await refresh();
      setIsNew(false);
      notify("Saved");
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

  const handleDelete = async (siteId: string) => {
    await deleteSite(siteId);
    await refresh();
    notify("Deleted");
    if (config.siteId === siteId) setScreen("home");
  };

  return (
    <div className="min-h-full bg-white">
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-neutral-900 px-4 py-2 text-[13px] font-medium text-white">
          {toast}
        </div>
      )}

      {screen === "home" ? (
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
            onDelete={handleDelete}
          />
        </>
      ) : (
        <SiteEditor
          config={config}
          sites={sites}
          isNew={isNew}
          saving={saving}
          onBack={() => setScreen("home")}
          onChange={setConfig}
          onSave={handleSave}
          onCopy={handleCopy}
          onPaste={applyPaste}
        />
      )}
    </div>
  );
}
