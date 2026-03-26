import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

type MoneySeriesPoint = { month: string; total: number };
type MoneyCategorySeries = { category: string; series: MoneySeriesPoint[] };

function toMonthKey(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const monthsRequested = Number(url.searchParams.get("months") ?? "6");
  const months = Math.min(Math.max(monthsRequested, 1), 24);

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const windowStart = new Date(
    currentMonthStart.getFullYear(),
    currentMonthStart.getMonth() - (months - 1),
    1,
    0,
    0,
    0,
    0,
  );

  type DecimalLike = { toNumber(): number };

  const txs: Array<{
    date: Date;
    amount: DecimalLike;
    categories: string[];
    merchantName: string | null;
    name: string;
  }> = await prisma.transaction.findMany({
    where: {
      userId,
      pending: false,
      date: { gte: windowStart },
    },
    select: {
      date: true,
      amount: true,
      categories: true,
      merchantName: true,
      name: true,
    },
  });

  const monthlyTotals = new Map<string, number>();
  const currentMonthCategoryTotals = new Map<string, number>();
  const currentMonthMerchantTotals = new Map<string, number>();

  for (const tx of txs) {
    const amount = tx.amount.toNumber();
    const monthKey = toMonthKey(tx.date);
    monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) ?? 0) + amount);

    const isCurrentMonth =
      tx.date.getFullYear() === currentMonthStart.getFullYear() &&
      tx.date.getMonth() === currentMonthStart.getMonth();

    if (!isCurrentMonth) continue;

    const category = tx.categories[0] ?? "Uncategorized";
    currentMonthCategoryTotals.set(
      category,
      (currentMonthCategoryTotals.get(category) ?? 0) + amount,
    );

    const merchant = tx.merchantName ?? tx.name;
    currentMonthMerchantTotals.set(
      merchant,
      (currentMonthMerchantTotals.get(merchant) ?? 0) + amount,
    );
  }

  // Sort month keys chronologically across the window
  const monthKeys: string[] = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(
      currentMonthStart.getFullYear(),
      currentMonthStart.getMonth() - (months - 1 - i),
      1,
    );
    monthKeys.push(toMonthKey(d));
  }

  const monthlySpend = monthKeys.map((m) => ({
    month: m,
    total: Number((monthlyTotals.get(m) ?? 0).toFixed(2)),
  }));

  const currentMonthTopCategories = Array.from(
    currentMonthCategoryTotals.entries(),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([category, total]) => ({
      category,
      total: Number(total.toFixed(2)),
    }));

  const currentMonthKey = toMonthKey(currentMonthStart);
  const currentMonthTotal = monthlyTotals.get(currentMonthKey) ?? 0;

  const topCategoryNames = currentMonthTopCategories
    .slice(0, 5)
    .map((c) => c.category);

  // Build category trends for the top categories
  const categoryTrends: MoneyCategorySeries[] = topCategoryNames.map(
    (category) => {
      const series: MoneySeriesPoint[] = monthKeys.map((m) => {
        // re-scan by category over small window (MVP)
        const total = txs
          .filter((tx) => (tx.categories?.[0] ?? "Uncategorized") === category)
          .filter((tx) => toMonthKey(tx.date) === m)
          .reduce((sum, tx) => sum + tx.amount.toNumber(), 0);

        return { month: m, total: Number(total.toFixed(2)) };
      });
      return { category, series };
    },
  );

  const topMerchants = Array.from(currentMonthMerchantTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([merchant, total]) => ({
      merchant,
      total: Number(total.toFixed(2)),
    }));

  return Response.json({
    months,
    currentMonthTotal: Number(currentMonthTotal.toFixed(2)),
    monthlySpend,
    categoryBreakdown: currentMonthTopCategories,
    categoryTrends,
    topMerchants,
  });
}

