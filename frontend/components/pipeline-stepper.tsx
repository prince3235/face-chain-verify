"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepStatus = "pending" | "active" | "done" | "error";
export type StepAccent = "scan" | "verify";

export interface PipelineStep {
  label: string;
  description: string;
  status: StepStatus;
  accent: StepAccent;
}

export function PipelineStepper({ steps }: { steps: PipelineStep[] }) {
  return (
    <ol className="flex flex-col gap-0">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const accentClass = step.accent === "scan" ? "scan" : "verify";

        return (
          <li key={step.label} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <span
                className={cn(
                  "absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px",
                  step.status === "done" && accentClass === "scan" && "bg-scan",
                  step.status === "done" && accentClass === "verify" && "bg-verify",
                  step.status !== "done" && "bg-border"
                )}
              />
            )}

            <span
              className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors duration-300",
                step.status === "done" &&
                  (accentClass === "scan"
                    ? "border-scan bg-scan text-ink"
                    : "border-verify bg-verify text-ink"),
                step.status === "active" &&
                  (accentClass === "scan"
                    ? "border-scan text-scan animate-pulsering"
                    : "border-verify text-verify animate-pulsering"),
                step.status === "pending" && "border-border text-text-muted",
                step.status === "error" && "border-danger text-danger"
              )}
            >
              {step.status === "done" ? (
                <Check size={16} />
              ) : step.status === "active" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                i + 1
              )}
            </span>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: step.status === "pending" ? 0.5 : 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="pt-0.5"
            >
              <p className="font-display text-sm font-medium text-text">
                {step.label}
              </p>
              <p className="mt-0.5 text-sm text-text-muted">
                {step.description}
              </p>
            </motion.div>
          </li>
        );
      })}
    </ol>
  );
}
