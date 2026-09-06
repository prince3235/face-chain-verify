"use client";

import { motion } from "framer-motion";
import { ExternalLink, User, ShieldCheck, Search, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { MatchResult } from "@/lib/api-client";

function getPlatformMeta(platform?: string) {
  if (!platform) return { icon: "🔍", color: "#6366f1", label: "Web Search" };
  const p = platform.toLowerCase();
  if (p.includes("instagram")) return { icon: "📸", color: "#e1306c", label: "Instagram" };
  if (p.includes("twitter") || p.includes("x (")) return { icon: "𝕏", color: "#1d9bf0", label: "X (Twitter)" };
  if (p.includes("facebook")) return { icon: "👤", color: "#1877f2", label: "Facebook" };
  if (p.includes("linkedin")) return { icon: "💼", color: "#0a66c2", label: "LinkedIn" };
  if (p.includes("tiktok")) return { icon: "🎵", color: "#ff0050", label: "TikTok" };
  if (p.includes("youtube")) return { icon: "▶️", color: "#ff0000", label: "YouTube" };
  if (p.includes("google lens")) return { icon: "🔍", color: "#4285f4", label: "Google Lens" };
  return { icon: "🔍", color: "#6366f1", label: platform };
}

export function MatchResultCard({ match }: { match: MatchResult }) {
  // ── No match ──────────────────────────────────────────────────────────
  if (!match.found) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-raised">
              <AlertCircle size={15} className="text-text-muted" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text">No Match Found</p>
              <p className="mt-0.5 text-xs text-text-muted">
                Face not found in the consented registry above the confidence threshold.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // ── Match found ────────────────────────────────────────────────────────
  const confidencePct = Math.round((match.confidence ?? 0) * 100);
  const { icon, color, label } = getPlatformMeta(match.sourcePlatform);
  const displayName = match.personName || "Identified Person";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <Card className="overflow-hidden p-0">

        {/* ── Colour accent bar ── */}
        <div
          className="h-1 w-full"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}66)` }}
        />

        <div className="p-5 space-y-4">

          {/* ── Identity row ── */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white shadow-md"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
            >
              {initials || <User size={22} />}
            </div>

            <div className="min-w-0 flex-1">
              {/* Name */}
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xl font-bold text-text leading-tight">{displayName}</p>
                <ShieldCheck size={16} className="shrink-0 text-verify" />
              </div>

              {/* Platform badge */}
              <div
                className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ background: `${color}22`, color }}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </div>
            </div>
          </div>

          {/* ── Profile link ── */}
          {match.postUrl && (
            <a
              href={match.postUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-lg border border-white/10 bg-surface-raised px-4 py-3 transition hover:border-white/20 hover:bg-white/5 group"
            >
              <div className="min-w-0">
                <p className="text-xs text-text-muted mb-0.5">Profile / Post Link</p>
                <p
                  className="truncate text-sm font-medium"
                  style={{ color }}
                >
                  {match.postUrl}
                </p>
              </div>
              <ExternalLink size={15} className="ml-3 shrink-0 text-text-muted group-hover:text-text transition" />
            </a>
          )}

          {/* ── Confidence bar ── */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-text-muted font-medium">Match Confidence</span>
              <span className="font-mono font-bold tabular-nums" style={{ color }}>
                {confidencePct}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-raised">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${confidencePct}%` }}
                transition={{ duration: 1.0, ease: "easeOut", delay: 0.15 }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${color}, ${color}bb)`,
                  boxShadow: `0 0 10px ${color}55`,
                }}
              />
            </div>
          </div>

          {/* ── Status pill ── */}
          <div className="flex items-center gap-2 pt-1">
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="h-2 w-2 rounded-full"
              style={{ background: color }}
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
