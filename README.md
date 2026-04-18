# Darksteel Mail — Starter Folder

This folder contains everything Claude Code needs to start building the Darksteel Mail platform. Drop the entire folder into your new project directory, then open Claude Code and point it at it.

---

## What's in here

```
darksteel-mail-starter/
├── README.md                      ← You are here
├── PROJECT.md                     ← Claude Code reads this at every session start
├── MILESTONES.md                  ← Build roadmap, sequential
├── CLAUDE_CODE_PROMPT.md          ← Copy-paste opening prompt for first session
├── .env.example                   ← Environment variables documented
└── design-reference/
    ├── brand-tokens.md            ← Design system source of truth
    ├── postcard-front-back.html   ← Static postcard mockup
    ├── postcard-live-demo.html    ← Interactive demo with form and Valpak comparison
    └── landing-page-original.html ← Original Darksteel landing page
```

---

## How to use this

### Step 1 — Set up the project directory

```bash
mkdir darksteel-mail
cd darksteel-mail
# Copy the contents of this starter folder (not the folder itself) into your project
# So you end up with: darksteel-mail/PROJECT.md, darksteel-mail/design-reference/, etc.
```

### Step 2 — Initialize git

```bash
git init
git add PROJECT.md MILESTONES.md CLAUDE_CODE_PROMPT.md .env.example design-reference/
git commit -m "Initial project brief and design reference"
```

### Step 3 — Open Claude Code

From the project directory:

```bash
claude-code
```

### Step 4 — Paste the opening prompt

Open `CLAUDE_CODE_PROMPT.md`, copy the block inside the triple-backtick fence, paste it as your first message to Claude Code.

### Step 5 — Review and approve

Claude Code will propose three things in order (schema, file structure, Stripe flow). Review each carefully before approving. Then let it build.

---

## What NOT to do

- **Don't skip reading MILESTONES.md yourself.** You should know what Milestone 1 covers so you can catch Claude Code if it works ahead.
- **Don't approve the schema without reading it.** Schema mistakes compound into every file that uses the tables.
- **Don't let it build the whole app in one go.** Small commits, working features, tested end-to-end before moving on.
- **Don't put real Stripe or Supabase keys in the repo.** `.env.local` is gitignored by default with Next.js. Verify before committing.

---

## When you're done with Milestone 1

Come back to the main conversation (not Claude Code) and tell me how it went. I'll help you plan Milestone 2 and refine anything that didn't work. Especially if the Stripe webhook logic or RLS policies gave you trouble — those are the most common places things break.

---

## Files maintained by Claude Code (will be created during build)

After Claude Code starts working, these files will appear and should be treated as Claude Code's responsibility to maintain. You can review them but don't hand-edit unless something's broken.

```
darksteel-mail/
├── supabase/
│   ├── migrations/
│   │   └── 0001_init.sql
│   └── seed.sql
├── app/
│   ├── zones/
│   │   └── [slug]/
│   │       └── page.tsx
│   └── api/
│       ├── checkout/route.ts
│       └── webhooks/stripe/route.ts
├── lib/
│   ├── supabase/
│   │   ├── server.ts
│   │   └── client.ts
│   └── stripe.ts
├── package.json
├── next.config.ts
├── tsconfig.json
└── tailwind.config.ts
```

The files YOU maintain are PROJECT.md, MILESTONES.md, CLAUDE_CODE_PROMPT.md, and the design-reference folder. Keep them updated as your understanding of the project evolves.
