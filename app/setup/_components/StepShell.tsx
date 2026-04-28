"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import LivePreview from "./LivePreview";
import type { SiteConfigPublic } from "@/lib/db/site_config";
import type { StepSlug } from "../_lib/steps";
import { nextStep, prevStep } from "../_lib/steps";
import { saveSite } from "../_lib/saveSite";
import type { SiteConfigUpsert } from "@/lib/db/site_config";

interface Props {
  step: StepSlug;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  draft: SiteConfigPublic;
  toPatch: () => SiteConfigUpsert;
}

// Two-column layout shared by every wizard step. The left column holds
// the form children. The right column renders LivePreview reactively
// from the draft. "Save & continue" POSTs the toPatch() output and
// navigates to the next step.
export default function StepShell({
  step,
  title,
  subtitle,
  children,
  draft,
  toPatch,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const back = prevStep(step);
  const next = nextStep(step);

  function onSaveAndContinue() {
    setError(null);
    const dest = next ?? "/admin";
    startTransition(async () => {
      try {
        await saveSite(toPatch());
        router.push(dest);
      } catch (e) {
        setError(e instanceof Error ? e.message : "save failed");
      }
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-10 max-w-[1400px] mx-auto px-6 py-10">
      <div className="min-w-0">
        <h1 className="font-display text-3xl sm:text-4xl tracking-[0.04em] mb-3">
          {title}
        </h1>
        <p className="font-body text-text-dim mb-10 max-w-2xl leading-relaxed">
          {subtitle}
        </p>

        <div className="flex flex-col gap-6">{children}</div>

        {error ? (
          <div className="mt-6 font-mono text-[0.7rem] tracking-[0.15em] uppercase text-red">
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-between mt-12">
          {back ? (
            <Link
              href={back}
              className="font-mono text-[0.7rem] tracking-[0.15em] uppercase text-text-dim hover:text-white transition inline-flex items-center gap-2"
            >
              <span aria-hidden>←</span> Back
            </Link>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={onSaveAndContinue}
            disabled={pending}
            className="bg-blue text-bg font-body font-bold text-sm uppercase tracking-wide px-7 py-3 hover:shadow-blue-glow hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:translate-y-0"
          >
            {pending ? "Saving…" : next ? "Save & Continue →" : "Save"}
          </button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 self-start">
        <div className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-text-dim mb-3">
          Live preview
        </div>
        <LivePreview config={draft} />
      </aside>
    </div>
  );
}
