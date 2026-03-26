import { auth } from "@clerk/nextjs/server";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import SpendingIntelligence from "./components/spending/SpendingIntelligence";
import PlaidConnectButton from "./components/plaid/PlaidConnectButton";

export default async function Home() {
  const { userId } = await auth();
  const signedIn = !!userId;

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 p-8 font-sans dark:bg-black">
      <main className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-sm dark:bg-black">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">MoneyMaker</h1>
          {signedIn ? (
            <UserButton />
          ) : null}
        </div>

        {!signedIn ? (
          <div className="mt-6 flex flex-col gap-3">
            <p className="text-zinc-600 dark:text-zinc-300">
              Sign in to connect your accounts and get reward-optimized
              recommendations.
            </p>
            <div className="flex gap-3 flex-wrap">
              <SignInButton mode="modal" />
              <SignUpButton mode="modal" />
            </div>
          </div>
        ) : null}

        {signedIn ? (
          <div className="mt-6">
            <p className="text-zinc-600 dark:text-zinc-300">
              Next: connect Plaid, sync transactions, then start credit-card
              optimization.
            </p>
            <div className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              MVP flow: non-blocking sync on open/refresh (incremental
              `/transactions/sync`).
            </div>
            <PlaidConnectButton />
          </div>
        ) : null}

        {signedIn ? <SpendingIntelligence /> : null}
      </main>
    </div>
  );
}
