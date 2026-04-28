"use client";

import { useState } from "react";
import StepShell from "../_components/StepShell";
import { FONT_PAIRINGS, PALETTES } from "@/lib/themes";
import type { SiteConfigPublic, SiteConfigUpsert } from "@/lib/db/site_config";

export default function LookStep({ initial }: { initial: SiteConfigPublic }) {
  const [palette, setPalette] = useState(initial.theme_palette);
  const [fontPair, setFontPair] = useState(initial.theme_font_pairing);

  const draft: SiteConfigPublic = {
    ...initial,
    theme_palette: palette,
    theme_font_pairing: fontPair,
  };

  const toPatch = (): SiteConfigUpsert => ({
    theme_palette: palette,
    theme_font_pairing: fontPair,
  });

  return (
    <StepShell
      step="look"
      title="Pick your look"
      subtitle="Choose a color theme and font pairing for your site. Both update the preview instantly."
      draft={draft}
      toPatch={toPatch}
    >
      <section>
        <div className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-text-dim mb-3">
          Color theme
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PALETTES.map((p) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => setPalette(p.slug)}
              className={`text-left p-4 border transition relative ${
                palette === p.slug
                  ? "border-blue shadow-[0_0_0_2px_var(--blue-glow)]"
                  : "border-border hover:border-border-hot"
              }`}
            >
              <div className="flex gap-2 mb-3">
                {p.swatches.map((sw, i) => (
                  <span
                    key={i}
                    className="flex-1 h-8 rounded-sm"
                    style={{ background: sw }}
                  />
                ))}
              </div>
              <span className="font-body text-sm text-white">{p.name}</span>
              {palette === p.slug ? (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue text-bg text-[0.7rem] flex items-center justify-center">
                  ✓
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-text-dim mb-3 mt-4">
          Font pairing
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FONT_PAIRINGS.map((f) => (
            <button
              key={f.slug}
              type="button"
              onClick={() => setFontPair(f.slug)}
              className={`text-left p-4 border transition ${
                fontPair === f.slug
                  ? "border-blue shadow-[0_0_0_2px_var(--blue-glow)]"
                  : "border-border hover:border-border-hot"
              }`}
            >
              <div className="font-display text-lg tracking-[0.04em] mb-1">
                {f.name}
              </div>
              <div className="font-body text-xs text-text-dim">
                {f.display} / {f.body}
              </div>
            </button>
          ))}
        </div>
        <p className="font-body text-xs text-text-faint mt-3">
          Note: only Anton + Manrope are loaded today. The other pairings are
          stored but not yet applied to rendering — that lands when the
          remaining Google fonts get wired up.
        </p>
      </section>
    </StepShell>
  );
}
