import { auth } from "@clerk/nextjs/server";
import { getPlaid } from "@/lib/plaid/plaidClient";
import { Products as PlaidProducts } from "plaid";
import { CountryCode } from "plaid";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Partial<{
    clientName: string;
  }>;

  const plaid = getPlaid();
  const linkTokenRes = await plaid.linkTokenCreate({
    user: {
      client_user_id: userId,
    },
    client_name: body.clientName ?? "MoneyMaker",
    products: [PlaidProducts.Transactions],
    country_codes: [CountryCode.Us],
    language: "en",
  });

  return Response.json({
    link_token: linkTokenRes.data.link_token,
  });
}

