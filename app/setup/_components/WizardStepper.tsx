import Link from "next/link";
import { WIZARD_STEPS, type StepSlug, stepIndex } from "../_lib/steps";

interface Props {
  current: StepSlug;
}

export default function WizardStepper({ current }: Props) {
  const currentIdx = stepIndex(current);
  return (
    <div className="border-b border-border bg-bg sticky top-0 z-20">
      <div className="max-w-[1400px] mx-auto px-6 py-4">
        <ol className="flex items-center justify-between gap-2 overflow-x-auto">
          {WIZARD_STEPS.map((step, i) => {
            const state =
              i < currentIdx ? "done" : i === currentIdx ? "current" : "upcoming";
            const ready = "ready" in step && step.ready === true;
            const isShipped = step.phase <= 3 || ready;
            const reachable = isShipped && i <= currentIdx + 1;
            const NumberCircle = (
              <span
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[0.7rem] font-mono tracking-wide shrink-0
                  ${state === "done"    ? "bg-blue text-bg" : ""}
                  ${state === "current" ? "border-2 border-blue text-blue" : ""}
                  ${state === "upcoming"? "border border-border text-text-faint" : ""}
                `}
              >
                {state === "done" ? "✓" : i + 1}
              </span>
            );
            const Label = (
              <span
                className={`font-mono text-[0.65rem] tracking-[0.15em] uppercase whitespace-nowrap
                  ${state === "done"     ? "text-blue" : ""}
                  ${state === "current"  ? "text-white" : ""}
                  ${state === "upcoming" ? "text-text-faint" : ""}
                `}
              >
                {step.label}
              </span>
            );
            const inner = (
              <span className="inline-flex items-center gap-2">
                {NumberCircle}
                <span className="hidden md:inline">{Label}</span>
              </span>
            );
            return (
              <li key={step.slug}>
                {reachable ? (
                  <Link href={step.href}>{inner}</Link>
                ) : (
                  <span aria-disabled className="opacity-60">{inner}</span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
