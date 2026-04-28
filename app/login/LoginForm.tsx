"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface Props {
  nextPath?: string;
  alreadySent?: boolean;
}

export default function LoginForm({ nextPath, alreadySent }: Props) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(Boolean(alreadySent));
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const callback = new URL("/auth/callback", window.location.origin);
    if (nextPath) callback.searchParams.set("next", nextPath);

    const { error: sendErr } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callback.toString() },
    });

    setSubmitting(false);
    if (sendErr) {
      setError(sendErr.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="bg-panel border border-border p-6">
        <div className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-blue mb-3">
          Check your inbox
        </div>
        <p className="font-body text-text-dim text-sm leading-relaxed">
          A magic link is on its way to <strong className="text-white">{email || "the operator email"}</strong>.
          Click it from this device. Links expire in one hour.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-text-dim">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@darksteelmail.com"
          autoComplete="email"
          className="mt-2 w-full bg-panel border border-border focus:border-blue focus:shadow-[0_0_0_3px_var(--blue-glow)] transition outline-none px-4 py-3 font-body text-base text-white placeholder:text-text-faint"
        />
      </label>

      {error ? (
        <div className="font-mono text-[0.7rem] tracking-[0.15em] uppercase text-red">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="bg-blue text-bg font-body font-bold text-sm uppercase tracking-wide px-6 py-3 hover:shadow-blue-glow hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:translate-y-0"
      >
        {submitting ? "Sending…" : "Send magic link"}
      </button>
    </form>
  );
}
