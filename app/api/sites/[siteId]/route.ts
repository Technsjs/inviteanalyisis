import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const SITES = "sites";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  try {
    const { siteId } = await params;
    if (!siteId) {
      return NextResponse.json({ error: "Site ID required" }, { status: 400 });
    }

    await getAdminDb().collection(SITES).doc(siteId).delete();
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete site";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
