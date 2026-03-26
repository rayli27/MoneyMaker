import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { decryptString } from "@/lib/plaid/tokenCrypto";
import { getPlaid } from "@/lib/plaid/plaidClient";
import type { Transaction as PlaidTransaction } from "plaid";

function parsePlaidDate(date: string) {
  // Plaid returns YYYY-MM-DD. Parse as UTC midnight.
  return new Date(`${date}T00:00:00.000Z`);
}

function txToCategories(tx: PlaidTransaction): string[] {
  const out: string[] = [];
  const pfc = tx.personal_finance_category;
  if (pfc?.primary) out.push(pfc.primary);
  if (pfc?.detailed) out.push(pfc.detailed);
  if (out.length > 0) return out;

  // Fallback to legacy categories.
  const legacy = tx.category ?? [];
  return Array.isArray(legacy) ? legacy.filter(Boolean) : [];
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const plaidItem = await prisma.plaidItem.findFirst({
    where: { userId },
    orderBy: { lastSyncAt: "desc" },
  });

  if (!plaidItem) {
    return new Response("Plaid not connected", { status: 400 });
  }

  const now = new Date();
  const lastSyncAt = plaidItem.lastSyncAt;
  if (lastSyncAt && now.getTime() - lastSyncAt.getTime() < 60_000) {
    return Response.json({
      skipped: true,
      lastSyncAt,
    });
  }

  const accessToken = decryptString(plaidItem.accessTokenEncrypted);
  const plaid = getPlaid();

  // Incremental sync can be paginated. MVP: loop until has_more false,
  // but cap pages to avoid infinite loops if Plaid keeps returning has_more.
  let cursor = plaidItem.cursor ?? undefined;
  let nextCursor: string = plaidItem.cursor ?? "";
  const maxPages = 5;

  let hasMore = true;
  let page = 0;

  while (hasMore && page < maxPages) {
    page += 1;

    const syncRes = await plaid.transactionsSync({
      access_token: accessToken,
      cursor,
      options: {
        // Request better categorization when available.
        include_personal_finance_category: true,
      },
    });

    const data = syncRes.data;

    // Upsert added + modified transactions.
    const updates = [...(data.added ?? []), ...(data.modified ?? [])];
    for (const tx of updates) {
      const amountStr = String(tx.amount);
      await prisma.transaction.upsert({
        where: { plaidTransactionId: tx.transaction_id },
        create: {
          userId,
          plaidItemId: plaidItem.plaidItemId,
          plaidAccountId: tx.account_id ?? null,
          plaidTransactionId: tx.transaction_id,
          date: parsePlaidDate(tx.date),
          amount: amountStr,
          currency: tx.iso_currency_code ?? "USD",
          name: tx.name ?? "Transaction",
          merchantName: tx.merchant_name ?? null,
          categories: txToCategories(tx),
          paymentChannel: tx.payment_channel ?? null,
          transactionType: tx.transaction_type ?? null,
          pending: !!tx.pending,
        },
        update: {
          date: parsePlaidDate(tx.date),
          amount: amountStr,
          currency: tx.iso_currency_code ?? "USD",
          name: tx.name ?? "Transaction",
          merchantName: tx.merchant_name ?? null,
          categories: txToCategories(tx),
          paymentChannel: tx.payment_channel ?? null,
          transactionType: tx.transaction_type ?? null,
          pending: !!tx.pending,
          // Keep identifying fields stable.
        },
      });
    }

    // Remove deleted transactions.
    const removed = data.removed ?? [];
    if (removed.length > 0) {
      await prisma.transaction.deleteMany({
        where: {
          userId,
          plaidTransactionId: {
            in: removed.map((r) => r.transaction_id).filter(Boolean),
          },
        },
      });
    }

    hasMore = data.has_more;
    nextCursor = data.next_cursor;
    cursor = nextCursor;
  }

  await prisma.plaidItem.update({
    where: { id: plaidItem.id },
    data: {
      cursor: nextCursor || null,
      lastSyncAt: now,
    },
  });

  return Response.json({ ok: true, lastSyncAt: now, cursor: nextCursor });
}

