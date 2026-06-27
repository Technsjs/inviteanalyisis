import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import type { EnvConfig } from "@/lib/env-config";

const SITES = "sites";

export async function GET() {
  try {
    const snap = await getAdminDb()
      .collection(SITES)
      .orderBy("updatedAt", "desc")
      .get();

    const sites = snap.docs.map((d) => {
      const data = d.data();
      return {
        siteId: d.id,
        config: data.config as EnvConfig,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
      };
    });

    return NextResponse.json({ sites });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load sites";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { config?: EnvConfig };
    const config = body.config;
    if (!config?.siteId?.trim()) {
      return NextResponse.json({ error: "Site ID required" }, { status: 400 });
    }

    const id = config.siteId.trim();
    await getAdminDb()
      .collection(SITES)
      .doc(id)
      .set({ config, updatedAt: new Date() }, { merge: true });

    return NextResponse.json({ ok: true, siteId: id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save site";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
