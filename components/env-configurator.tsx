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
type Toast = { message: string; type: "ok" | "err" | "info" };

function ToastBar({ toast }: { toast: Toast | null }) {
  if (!toast) return null;
  const colors = { ok: "bg-emerald-600", err: "bg-red-500", info: "bg-indigo-600" };
  return (
    <div
      className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 animate-fade-up rounded-full px-4 py-2 text-sm font-medium text-white shadow-lg ${colors[toast.type]}`}
    >
      {toast.message}
    </div>
  );
}

export function EnvConfigurator() {
  const [screen, setScreen] = useState<Screen>("home");
  const [config, setConfig] = useState<EnvConfig>(DEFAULT_ENV);
  const [isNew, setIsNew] = useState(true);
  const [sites, setSites] = useState<SavedSite[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  const output = useMemo(() => serializeEnv(config), [config]);

  const notify = useCallback((message: string, type: Toast["type"] = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2400);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setSites(await listSites());
      setSetupError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load sites";
      setSetupError(msg);
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

  const goHome = () => setScreen("home");

  const applyPaste = (text: string) => {
    const parsed = parseEnvText(text);
    if (Object.keys(parsed).length === 0) return;
    setConfig(mergeEnvConfig(parsed));
    notify(`Loaded ${Object.keys(parsed).length} values`, "ok");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSite(config);
      await refresh();
      setIsNew(false);
      notify(`Saved ${config.siteId}`, "ok");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Save failed", "err");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    notify("Copied to clipboard", "ok");
  };

  const handleDelete = async (siteId: string) => {
    if (!confirm(`Delete ${siteId}?`)) return;
    await deleteSite(siteId);
    await refresh();
    notify(`Deleted ${siteId}`, "info");
    if (config.siteId === siteId) goHome();
  };

  return (
    <div className="min-h-full bg-zinc-100">
      <ToastBar toast={toast} />

      {screen === "home" ? (
        <>
          <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur-xl">
            <div className="mx-auto max-w-lg px-4 py-4 sm:max-w-2xl sm:px-6">
              <h1 className="text-xl font-semibold text-zinc-900">Invite Setup</h1>
              <p className="text-sm text-zinc-500">Manage your Vercel sites</p>
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
          onBack={goHome}
          onChange={setConfig}
          onSave={handleSave}
          onCopy={handleCopy}
          onPaste={applyPaste}
        />
      )}
    </div>
  );
}
