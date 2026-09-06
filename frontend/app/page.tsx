import Link from "next/link";
import { ScanFace, Search, Link2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const stages = [
  {
    icon: ScanFace,
    title: "Face scan",
    body: "Detect and encode a face from an uploaded photo — a real biometric embedding, not a placeholder.",
    accent: "text-scan",
  },
  {
    icon: Search,
    title: "Registry search",
    body: "Match the embedding against a consented dataset of opted-in faces and posts — genuine similarity search.",
    accent: "text-scan",
  },
  {
    icon: Link2,
    title: "Chain anchor",
    body: "Hash the matched post and write it to a public testnet, then re-verify the record live.",
    accent: "text-verify",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-ink">
      <div className="scan-grid pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative mx-auto flex max-w-3xl flex-col px-6 pb-24 pt-8">
        <div className="flex items-center justify-between">
          <span className="font-display text-sm font-semibold tracking-tight text-text">
            face-chain-verify
          </span>
          <ThemeToggle />
        </div>

        <div className="mt-20 sm:mt-28">
          <h1 className="max-w-xl font-display text-4xl font-semibold leading-tight text-text sm:text-5xl">
            Turn a face scan into a verifiable, on-chain record.
          </h1>
          <p className="mt-5 max-w-md text-base text-text-muted">
            A consent-scoped pipeline: detect a face, find its matching post
            in an opted-in registry, and anchor the discovery to a
            blockchain so it can never be quietly altered.
          </p>
          <Link href="/verify">
            <Button className="mt-8 h-11 px-6 text-sm">
              Start verification
            </Button>
          </Link>
        </div>

        <div className="mt-24 grid gap-4 sm:grid-cols-3">
          {stages.map((stage, i) => (
            <div
              key={stage.title}
              className="rounded-lg border border-border bg-surface/60 p-5 backdrop-blur-sm"
            >
              <stage.icon size={20} className={stage.accent} />
              <p className="mt-3 font-display text-sm font-medium text-text">
                {i + 1}. {stage.title}
              </p>
              <p className="mt-1.5 text-sm text-text-muted">{stage.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-16 text-xs text-text-muted">
          Search runs only against faces and posts that explicitly opted in
          for this demo — see the consent policy in the repo.
        </p>
      </div>
    </main>
  );
}
