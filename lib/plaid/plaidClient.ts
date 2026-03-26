import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

let cached: PlaidApi | null = null;

export function getPlaid() {
  if (cached) return cached;

  const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
  const PLAID_SECRET = process.env.PLAID_SECRET;
  const PLAID_ENV = process.env.PLAID_ENV;

  if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
    throw new Error("Missing PLAID_CLIENT_ID or PLAID_SECRET in environment.");
  }

  const basePath =
    PLAID_ENV === "production"
      ? PlaidEnvironments.production
      : PlaidEnvironments.sandbox;

  const configuration = new Configuration({
    basePath,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": PLAID_CLIENT_ID,
        "PLAID-SECRET": PLAID_SECRET,
      },
    },
  });

  cached = new PlaidApi(configuration);
  return cached;
}

