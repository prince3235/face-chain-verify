"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { FaceUploader } from "@/components/face-uploader";
import { PipelineStepper, type PipelineStep } from "@/components/pipeline-stepper";
import { MatchResultCard } from "@/components/match-result-card";
import { ChainBadge } from "@/components/chain-badge";
import {
  detectFace,
  searchMatch,
  chainVerify,
  type FaceEncoding,
  type MatchResult,
  type ChainRecord,
} from "@/lib/api-client";

type Stage = "idle" | "scanning" | "searching" | "chaining" | "done" | "error";

export default function VerifyPage() {
  const [stage, setStage] = useState<Stage>("idle");
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [record, setRecord] = useState<ChainRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function runPipeline(file: File) {
    setErrorMsg(null);
    setMatch(null);
    setRecord(null);

    try {
      setStage("scanning");
      const encoding: FaceEncoding = await detectFace(file);

      setStage("searching");
      const matchResult = await searchMatch(encoding);
      setMatch(matchResult);

      if (!matchResult.found) {
        setStage("done");
        return;
      }

      setStage("chaining");
      const chainRecord = await chainVerify(matchResult);
      setRecord(chainRecord);

      setStage("done");
    } catch (err) {
      setStage("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Something went wrong in the pipeline."
      );
    }
  }

  const steps: PipelineStep[] = [
    {
      label: "Detect & encode face",
      description: "Locating the face and computing its embedding.",
      accent: "scan",
      status:
        stage === "idle"
          ? "pending"
          : stage === "scanning"
          ? "active"
          : stage === "error" && !match
          ? "error"
          : "done",
    },
    {
      label: "Search consented registry",
      description: "Comparing the embedding against opted-in posts.",
      accent: "scan",
      status:
        stage === "idle" || stage === "scanning"
          ? "pending"
          : stage === "searching"
          ? "active"
          : stage === "error" && !match
          ? "error"
          : "done",
    },
    {
      label: "Anchor on blockchain",
      description: "Hashing the match and writing it to the testnet.",
      accent: "verify",
      status:
        stage === "idle" || stage === "scanning" || stage === "searching"
          ? "pending"
          : stage === "chaining"
          ? "active"
          : stage === "done" && record
          ? "done"
          : stage === "done" && !record
          ? "pending"
          : stage === "error"
          ? "error"
          : "pending",
    },
  ];

  return (
    <main className="min-h-screen bg-ink">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
          >
            <ArrowLeft size={15} /> Back
          </Link>
          <ThemeToggle />
        </div>

        <h1 className="mt-10 font-display text-2xl font-semibold text-text">
          Run the verification pipeline
        </h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Upload a face from the consented demo dataset to see the full flow.
        </p>

        <div className="mt-10 grid gap-10 sm:grid-cols-[minmax(0,320px)_1fr]">
          <FaceUploader
            onSelect={runPipeline}
            isScanning={stage === "scanning"}
            disabled={stage !== "idle" && stage !== "done" && stage !== "error"}
          />

          <div className="flex flex-col gap-8">
            <PipelineStepper steps={steps} />

            {errorMsg && (
              <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p>{errorMsg}</p>
              </div>
            )}

            {match && <MatchResultCard match={match} />}
            {record && <ChainBadge record={record} />}
          </div>
        </div>
      </div>
    </main>
  );
}
