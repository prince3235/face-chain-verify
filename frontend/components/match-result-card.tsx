"use client";

import { motion } from "framer-motion";
import { ExternalLink, User, ShieldCheck, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { MatchResult } from "@/lib/api-client";

function getPlatformIcon(platform?: string) {
  if (!platform) return "🔍";
  const p = platform.toLowerCase();
  if (p.includes("instagram")) return "📸";
  if (p.includes("twitter") || p.includes("x (")) return "𝕏";
  if (p.includes("facebook")) return "👤";
  if (p.includes("linkedin")) return "💼";
  if (p.includes("tiktok")) return "🎵";
  if (p.includes("youtube")) return "▶️";
  if (p.includes("reddit")) return "🤖";
  return "🔍";
}

function getPlatformColor(platform?: string) {
  if (!platform) return "#6366f1";
  const p = platform.toLowerCase();
  if (p.includes("instagram")) return "#e1306c";
  if (p.includes("twitter") || p.includes("x (")) return "#1d9bf0";
  if (p.includes("facebook")) return "#1877f2";
  if (p.includes("linkedin")) return "#0a66c2";
  if (p.includes("tiktok")) return "#ff0050";
  if (p.includes("youtube")) return "#ff0000";
  return "#6366f1";
}

export function MatchResultCard({ match }: { match: MatchResult }) {
  if (!match.found) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-raised">
              <Search size={18} className="text-text-muted" />
            </div>
            <div>
              <p className="text-sm font-medium text-text">No Match Found</p>
              <p className="mt-0.5 text-xs text-text-muted">
                Face not found in the consented registry above the confidence threshold.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  const confidencePct = Math.round((match.confidence ?? 0) * 100);
  const platformColor = getPlatformColor(match.sourcePlatform);
  const platformIcon = getPlatformIcon(match.sourcePlatform);
  const displayName = match.personName || "Unknown Person";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden p-0">
        {/* Top accent bar */}
        <div
          className="h-1 w-full"
          style={{ background: `linear-gradient(90deg, ${platformColor}, ${platformColor}88)` }}
        />

        <div className="p-5">
          {/* Person identity section */}
          <div className="flex items-center gap-4">
            {/* Avatar with initials */}
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${platformColor}, ${platformColor}99)`,
              }}
            >
              {initials || <User size={22} />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-xl font-bold text-text">{displayName}</p>
                <ShieldCheck size={16} className="shrink-0 text-verify" />
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-sm">{platformIcon}</span>
                <span className="text-xs text-text-muted">{match.sourcePlatform ?? "Web Search"}</span>
              </div>
            </div>

            {match.postUrl && (
              <a
                href={match.postUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-raised text-text-muted transition hover:scale-110 hover:text-scan"
                aria-label="View profile"
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>

          {/* Match details */}
          {match.postText && (
            <p className="mt-4 text-xs leading-relaxed text-text-muted">
              {match.postText}
            </p>
          )}

          {/* Confidence bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Match Confidence</span>
              <span
                className="font-mono font-semibold tabular-nums"
                style={{ color: platformColor }}
              >
                {confidencePct}%
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-raised">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${confidencePct}%` }}
                transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${platformColor}, ${platformColor}bb)`,
                  boxShadow: `0 0 8px ${platformColor}66`,
                }}
              />
            </div>
          </div>

          {/* Status chip */}
          <div className="mt-4 flex items-center gap-1.5">
            <div
              className="h-1.5 w-1.5 animate-pulse rounded-full"
              style={{ background: platformColor }}
            />
            <span className="text-xs text-text-muted">
              Identity verified via reverse image search
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
