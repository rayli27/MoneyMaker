"use client";

import { useEffect, useMemo, useState } from "react";
import { usePlaidLink } from "react-plaid-link";

export default function PlaidConnectButton() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadToken() {
      try {
        setLoadingToken(true);
        setError(null);
        const res = await fetch("/api/plaid/link-token", { method: "POST" });
        if (!res.ok) throw new Error(`Link token request failed: ${res.status}`);
        const json = (await res.json()) as { link_token: string };
        if (!cancelled) setLinkToken(json.link_token);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!cancelled) setLoadingToken(false);
      }
    }

    loadToken().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const onSuccess = useMemo(
    () =>
      async (public_token: string) => {
        try {
          setError(null);
          const res = await fetch("/api/plaid/exchange-public-token", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ public_token }),
          });
          if (!res.ok) {
            throw new Error(`Token exchange failed: ${res.status}`);
          }

          // MVP: simplest way to re-trigger sync + refresh UI.
          window.location.reload();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Unknown error");
        }
      },
    [],
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  return (
    <div className="mt-6 flex flex-col gap-3">
      <button
        className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-900 disabled:opacity-50"
        onClick={() => open()}
        disabled={!ready || loadingToken}
      >
        {loadingToken ? "Preparing connection..." : "Connect Plaid"}
      </button>
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}

