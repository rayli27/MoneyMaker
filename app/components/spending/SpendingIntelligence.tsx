"use client";

import { useEffect, useState } from "react";

type MoneySeriesPoint = { month: string; total: number };
type MoneyCategorySeries = { category: string; series: MoneySeriesPoint[] };

type SpendingIntelligenceResponse = {
  months: number;
  currentMonthTotal: number;
  monthlySpend: MoneySeriesPoint[];
  categoryBreakdown: { category: string; total: number }[];
  categoryTrends: MoneyCategorySeries[];
  topMerchants: { merchant: string; total: number }[];
};

export default function SpendingIntelligence() {
  const [data, setData] = useState<SpendingIntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchInsights() {
      try {
        const res = await fetch("/api/spending/intelligence?months=6", {
          method: "GET",
        });
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        const json = (await res.json()) as SpendingIntelligenceResponse;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unknown error");
      }
    }

    async function run() {
      // Non-blocking sync: kick off sync, but do not wait before showing cached insights.
      const syncPromise = fetch("/api/plaid/sync", { method: "POST" })
        .then(() => "synced")
        .catch(() => "not-synced");

      setLoading(true);
      setError(null);
      await fetchInsights();
      if (cancelled) return;

      // After sync finishes (or fails), refresh insights once.
      await syncPromise;
      if (cancelled) return;
      await fetchInsights();

      if (!cancelled) setLoading(false);
    }

    run().catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-black dark:text-zinc-300">
        Syncing spending insights...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
        Failed to load spending intelligence: {error}
      </div>
    );
  }

  if (!data || data.monthlySpend.every((p) => p.total === 0)) {
    return (
      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-black dark:text-zinc-300">
        No transaction data yet. Connect Plaid and sync to see spending intelligence.
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-black">
        <div className="text-sm text-zinc-500">Current month spend</div>
        <div className="mt-1 text-2xl font-semibold">
          ${data.currentMonthTotal.toFixed(2)}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-black">
          <div className="text-sm font-medium">Monthly spend (last {data.months} months)</div>
          <div className="mt-3 space-y-2">
            {data.monthlySpend
              .slice()
              .reverse()
              .map((p) => (
                <div key={p.month} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-300">{p.month}</span>
                  <span className="font-medium">${p.total.toFixed(2)}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-black">
          <div className="text-sm font-medium">Category breakdown (current month)</div>
          <div className="mt-3 space-y-2">
            {data.categoryBreakdown.length === 0 ? (
              <div className="text-sm text-zinc-500">No categories found.</div>
            ) : (
              data.categoryBreakdown.slice(0, 10).map((c) => (
                <div key={c.category} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-300">{c.category}</span>
                  <span className="font-medium">${c.total.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-black">
        <div className="text-sm font-medium">Top merchants (current month)</div>
        <div className="mt-3 space-y-2">
          {data.topMerchants.length === 0 ? (
            <div className="text-sm text-zinc-500">No merchants found.</div>
          ) : (
            data.topMerchants.slice(0, 10).map((m) => (
              <div key={m.merchant} className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-300">{m.merchant}</span>
                <span className="font-medium">${m.total.toFixed(2)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {data.categoryTrends.length > 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-black">
          <div className="text-sm font-medium">Category trends</div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {data.categoryTrends.slice(0, 6).map((t) => (
              <div key={t.category} className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-900/40">
                <div className="text-sm font-medium">{t.category}</div>
                <div className="mt-2 space-y-1">
                  {t.series.map((p) => (
                    <div key={p.month} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">{p.month}</span>
                      <span className="font-medium">${p.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

