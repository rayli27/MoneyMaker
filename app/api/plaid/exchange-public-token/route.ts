import { auth } from "@clerk/nextjs/server";
import { getPlaid } from "@/lib/plaid/plaidClient";
import prisma from "@/lib/prisma";
import { encryptString } from "@/lib/plaid/tokenCrypto";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    public_token?: string;
  };
  if (!body.public_token) {
    return new Response("Missing public_token", { status: 400 });
  }

  const plaid = getPlaid();
  const exchangeRes = await plaid.itemPublicTokenExchange({
    public_token: body.public_token,
  });

  const accessToken = exchangeRes.data.access_token;
  const itemId = exchangeRes.data.item_id;

  // MVP: single Plaid item per user is fine. If a user connects multiple
  // items, we’ll keep separate PlaidItem records.
  const plaidItem = await prisma.plaidItem.upsert({
    where: { plaidItemId: itemId },
    create: {
      userId,
      plaidItemId: itemId,
      accessTokenEncrypted: encryptString(accessToken),
      cursor: null,
      lastSyncAt: null,
    },
    update: {
      userId,
      accessTokenEncrypted: encryptString(accessToken),
    },
  });

  // Create/update accounts for the item.
  // `itemPublicTokenExchange` only returns access_token + item_id, so we must
  // call `/accounts/get` to fetch the accounts list.
  const accountsRes = await plaid.accountsGet({
    access_token: accessToken,
  });

  const accounts = accountsRes.data.accounts ?? [];
  await Promise.all(
    accounts.map((acc) =>
      prisma.plaidAccount.upsert({
        where: {
          plaidItemId_plaidAccountId: {
            plaidItemId: plaidItem.plaidItemId,
            plaidAccountId: acc.account_id,
          },
        },
        create: {
          userId,
          plaidItemId: plaidItem.plaidItemId,
          plaidAccountId: acc.account_id,
          name: acc.name ?? null,
          mask: acc.mask ?? null,
          officialName: acc.official_name ?? null,
          type: acc.type ?? null,
          subtype: acc.subtype ?? null,
        },
        update: {
          name: acc.name ?? null,
          mask: acc.mask ?? null,
          officialName: acc.official_name ?? null,
          type: acc.type ?? null,
          subtype: acc.subtype ?? null,
        },
      }),
    ),
  );

  return Response.json({ ok: true });
}

