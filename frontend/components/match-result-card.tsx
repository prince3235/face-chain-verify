"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { MatchResult } from "@/lib/api-client";

export function MatchResultCard({ match }: { match: MatchResult }) {
  if (!match.found) {
    return (
      <Card className="animate-rise p-5">
        <p className="text-sm text-text-muted">
          No matching post found in the consented registry above the
          confidence threshold.
        </p>
      </Card>
    );
  }

  const confidencePct = Math.round((match.confidence ?? 0) * 100);

  return (
    <Card className="animate-rise p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">
            {match.sourcePlatform}
          </p>
          <p className="mt-1 text-sm text-text">{match.postText}</p>
        </div>
        {match.postUrl && (
          <a
            href={match.postUrl}
            target="_blank"
            rel="noreferrer"
            className="text-text-muted hover:text-scan"
            aria-label="Open source post"
          >
            <ExternalLink size={16} />
          </a>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>Match confidence</span>
          <span className="font-mono font-tabular">{confidencePct}%</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidencePct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-scan"
          />
        </div>
      </div>
    </Card>
  );
}
