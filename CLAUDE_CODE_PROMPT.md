# Claude Code — Opening prompt for first session

Copy and paste the block below into your first Claude Code session. Do not modify it.

---

```
You are working on the Darksteel Mail project. Before you write any code, do these four things in order:

1. Read PROJECT.md in the repo root. This is the project brief. Everything you need to know about what we're building, who it's for, and the technical constraints is in there.

2. Read MILESTONES.md. Only focus on Milestone 1. Do not work ahead.

3. Read design-reference/brand-tokens.md. This is the visual source of truth. Match it exactly. Do not invent new colors, fonts, or component patterns.

4. Open design-reference/postcard-front-back.html, design-reference/postcard-live-demo.html, and design-reference/landing-page-original.html in a browser or view them as text. Pattern-match the visual language from these files when building new components.

Then, before writing any code, propose the following three things for my review:

A. The full Supabase migration SQL for Milestone 1 — tables, indexes, RLS policies, seed data. One file, one migration. Show it to me in a code block for review.

B. The file structure for the Next.js app — which files will exist, what each one does, and which ones are server components vs client components.

C. The Stripe integration flow — exactly which request hits which endpoint in what order, from "prospect clicks spot" through "webhook marks spot sold." Written as a numbered sequence, not code.

After I approve all three, build Milestone 1 in small commits. Each commit should be a working unit — one feature, deployable, testable. Do not write a 500-line PR. Do not skip testing the Stripe webhook with the Stripe CLI before declaring anything done.

Constraints you must respect:
- No localStorage or browser storage APIs (design reference says so)
- No exposing SUPABASE_SERVICE_ROLE_KEY to the browser (never NEXT_PUBLIC_ prefix it)
- Webhook handler must be idempotent (check if stripe_session_id already sold before processing)
- pending_at timestamp on spots table, cron sweep after 30 min
- RLS policies written for anon role explicitly, tested with anon client not just service role
- Stripe cancel URL flips pending spot back to available immediately (don't rely on the sweep)
- Category exclusivity is NOT 1:1 — use the groupings in PROJECT.md / the seed data

When you're ready, start with step A (the migration SQL).
```

---

## What to expect

Claude Code will read the files, ask clarifying questions if needed, and produce:

1. A migration SQL file — review the schema before approving
2. A file structure proposal — look for anything surprising
3. The Stripe flow sequence — make sure the webhook and idempotency are covered

Only after you approve all three should it start writing TypeScript.

## Red flags to watch for

If Claude Code does any of these, stop it and point it back at the constraints:

- Proposes `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` — service role key must be server-only
- Skips the webhook idempotency check — duplicate webhooks will re-process payments
- Writes the schema and app code in the same turn without showing you the schema first
- Invents new colors or fonts not in brand-tokens.md
- Skips the category exclusivity groupings and does 1:1 category blocking
- Tries to build the advertiser dashboard or admin panel as part of Milestone 1
- Uses localStorage anywhere (common mistake, shouldn't happen if it reads PROJECT.md)

## After Milestone 1 is working

When Claude Code reports Milestone 1 is complete:

1. Pull it locally, run `npm run dev`, and do a real checkout with Stripe test card `4242 4242 4242 4242`
2. Verify the spot appears as sold in Supabase Studio
3. Try to claim the same spot from a second browser — should be blocked
4. Check the Vercel deployment is live on a staging URL
5. Only then say "Milestone 1 is complete, let's plan Milestone 2"

## If something is ambiguous

Claude Code should ask YOU (Mike) before guessing. If it's making up business logic ("I'll assume pricing is $500 per spot"), stop it. The prices are in PROJECT.md. The categories and groupings are in the seed data. Ambiguity means "ask the user," not "guess and keep going."
