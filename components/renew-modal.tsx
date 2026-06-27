"use client";

import { useEffect, useState } from "react";

export function RenewModal({
  siteId,
  currentDate,
  currentTime,
  saving,
  onClose,
  onConfirm,
}: {
  siteId: string;
  currentDate: string;
  currentTime: string;
  saving: boolean;
  onClose: () => void;
  onConfirm: (eventDate: string) => void;
}) {
  const [date, setDate] = useState(currentDate);

  useEffect(() => {
    setDate(currentDate);
  }, [currentDate]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div
        className="w-full max-w-sm rounded-t-2xl bg-white p-5 sm:rounded-2xl"
        role="dialog"
        aria-labelledby="renew-title"
      >
        <h2 id="renew-title" className="text-[17px] font-semibold">
          Renew {siteId}
        </h2>
        <p className="mt-1 text-[13px] text-neutral-500">
          New expiry date (YYYY-MM-DD)
        </p>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-4 w-full rounded-xl border border-neutral-200 px-3 py-3 text-[15px] outline-none focus:border-neutral-400"
        />

        {currentTime && (
          <p className="mt-2 text-[12px] text-neutral-400">
            Time stays {currentTime} — edit in Edit for full change
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-full border border-neutral-300 py-3 text-[15px] font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => date && onConfirm(date)}
            disabled={saving || !date}
            className="flex-1 rounded-full bg-neutral-900 py-3 text-[15px] font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Renew"}
          </button>
        </div>
      </div>
    </div>
  );
}
