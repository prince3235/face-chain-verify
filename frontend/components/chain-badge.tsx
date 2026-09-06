"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { truncateMiddle, cn } from "@/lib/utils";
import { reVerify, type ChainRecord } from "@/lib/api-client";

export function ChainBadge({ record }: { record: ChainRecord }) {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<"idle" | "checking" | "verified" | "failed">(
    "idle"
  );

  async function handleCopy() {
    await navigator.clipboard.writeText(record.txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleReVerify() {
    setStatus("checking");
    try {
      const result = await reVerify(record);
      setStatus(result.matches ? "verified" : "failed");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <Card className="animate-rise overflow-hidden p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck size={18} className="text-verify" />
        <p className="font-display text-sm font-medium text-text">
          Anchored on {record.network}
        </p>
      </div>

      <dl className="mt-4 space-y-2 text-xs">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-text-muted">Transaction</dt>
          <dd className="flex items-center gap-1.5 font-mono text-text">
            {truncateMiddle(record.txHash, 8, 6)}
            <button
              onClick={handleCopy}
              aria-label="Copy transaction hash"
              className="text-text-muted hover:text-scan"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-text-muted">Content hash</dt>
          <dd className="font-mono text-text">
            {truncateMiddle(record.postHash, 8, 6)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-text-muted">Timestamp</dt>
          <dd className="font-mono text-text">
            {new Date(record.timestamp).toLocaleString()}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex items-center gap-3">
        <a
          href={`${record.blockExplorerUrl}${record.txHash}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-scan hover:underline"
        >
          View on explorer <ExternalLink size={12} />
        </a>
        <Button
          variant="secondary"
          className="ml-auto h-8 px-3 text-xs"
          onClick={handleReVerify}
          disabled={status === "checking"}
        >
          {status === "checking" ? (
            <Spinner className="h-3.5 w-3.5" />
          ) : (
            <RefreshCw size={13} />
          )}
          Re-verify
        </Button>
      </div>

      <AnimatePresence>
        {status !== "idle" && status !== "checking" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "mt-3 flex items-center gap-1.5 rounded-md px-3 py-2 text-xs",
              status === "verified"
                ? "bg-verify/10 text-verify"
                : "bg-danger/10 text-danger"
            )}
          >
            {status === "verified" ? (
              <>
                <Check size={13} /> On-chain hash matches source data —
                tamper-evidence confirmed.
              </>
            ) : (
              <>Hash mismatch detected — record may have been altered.</>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
