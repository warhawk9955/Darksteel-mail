# Darksteel Mail — Brand Tokens

**Source of truth for all visual decisions.** Extracted from the design-reference HTML files. Do not deviate without asking.

---

## Color palette

### Backgrounds (dark theme)

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#0a0a0a` | Page background, primary surface |
| `--panel` | `#141414` | Raised panels, form containers |
| `--panel-2` | `#1c1c1c` | Hover states, secondary panels |
| `--border` | `#262626` | Default borders, dividers |
| `--border-hot` | `#333333` | Interactive borders, buttons |

### Text

| Token | Hex | Use |
|---|---|---|
| `--text` | `#ededed` | Primary text on dark surfaces |
| `--text-dim` | `#8a8a8a` | Secondary text, labels |
| `--text-faint` | `#555555` | Tertiary text, placeholders |

### Accent colors

| Token | Hex | Use | Notes |
|---|---|---|---|
| `--blue` | `#00aaff` | Primary brand, CTAs, featured tier | The dominant brand color. Use sparingly for emphasis. |
| `--blue-glow` | `rgba(0, 170, 255, 0.35)` | Box shadows on primary CTAs | For glow effects on buttons and focused inputs |
| `--red` | `#ff2244` | Urgency, warnings, alt advertiser accent | Use only for warnings and one alt spot color |
| `--orange` | `#ff8866` | Secondary featured tier, warm accent | Used on hero spot #2 on the back |
| `--amber` | `#ffaa00` | Spot accent option | Advertiser color choice only |
| `--teal` | `#00ccaa` | Spot accent option | Advertiser color choice only |
| `--pink` | `#ff88ee` | Spot accent option | Advertiser color choice only |

### Grid background (signature effect)

Apply to `body::before` as a full-viewport fixed overlay:

```css
background-image:
  linear-gradient(var(--border) 1px, transparent 1px),
  linear-gradient(90deg, var(--border) 1px, transparent 1px);
background-size: 64px 64px;
opacity: 0.2;
mask-image: radial-gradient(ellipse at center, black 40%, transparent 90%);
```

This grid is part of the brand. Use on all main pages.

---

## Typography

### Font families

| Variable | Stack | Use |
|---|---|---|
| `--font-display` | `'Anton', 'Impact', sans-serif` | All headlines, big numbers, brand marks |
| `--font-body` | `'Manrope', system-ui, sans-serif` | Body copy, form inputs, paragraphs |
| `--font-mono` | `'JetBrains Mono', 'Courier New', monospace` | Labels, metadata, technical callouts |
| `--font-serif` | `'Playfair Display', serif` | Offer prices on postcard, editorial italics |

Load from Google Fonts:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Manrope:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

### Type rules

- **Headlines (Anton):** Always uppercase. Letter-spacing 0.02em to 0.1em depending on size. Weight 400 only (Anton has one weight).
- **Body (Manrope):** Sentence case. Line-height 1.55-1.6. Weights 400 (regular), 500 (medium), 700 (bold).
- **Mono labels (JetBrains Mono):** Always UPPERCASE. Letter-spacing 0.12em-0.2em. Used for eyebrow labels, metadata, technical strings.
- **Serif (Playfair Display):** Only for offer prices on postcards and occasional editorial italics. Never for body copy.

### Type scale

| Size | Use |
|---|---|
| clamp(2.8rem, 7vw, 6rem) | Hero H1 |
| clamp(2.2rem, 5vw, 4rem) | Section H2 |
| 1.4rem | H3, component headlines |
| 1.05-1.2rem | Body large, card titles |
| 0.9-1rem | Body default |
| 0.82rem | Body small |
| 0.75rem | Secondary labels |
| 0.62-0.72rem | Mono eyebrows (UPPERCASE) |

---

## Spacing

- Use rem for vertical rhythm: 0.5rem, 1rem, 1.5rem, 2rem, 3rem, 4rem.
- Use px for component-internal gaps: 2px, 4px, 8px, 12px, 16px, 24px.
- Section vertical padding on marketing pages: 6rem top and bottom, reduced to 4rem on mobile.
- Page max-width: 1200px for marketing, 1400px for app surfaces.

---

## Corner radius

Postcards and the design reference do not use much rounding. Keep radii subtle.

- Buttons, inputs, small cards: 0 (square) or 2px
- Mid-size cards, panels: 4px
- Large featured surfaces: 8px max
- No pill shapes. No fully-rounded anything.

---

## Component patterns

### Primary button (CTA)

```tsx
<button className="
  bg-[var(--blue)] text-[var(--bg)]
  font-['Manrope'] font-bold
  text-sm tracking-wide uppercase
  px-8 py-4
  hover:shadow-[0_0_32px_var(--blue-glow)]
  hover:-translate-y-0.5
  transition-all duration-200
">
  Lock in this spot →
</button>
```

Arrow on the right, transforms on hover (translates +4px), blue glow box-shadow.

### Secondary button

Outlined with `--border-hot`, transparent background, white text. Hovers to white border.

### Input field

```tsx
<input className="
  w-full
  bg-[var(--bg)]
  border border-[var(--border)]
  text-[var(--text)]
  font-['Manrope']
  text-base
  px-3 py-2.5
  focus:border-[var(--blue)]
  focus:ring-2 focus:ring-[var(--blue-glow)]
  focus:outline-none
  transition
" />
```

Label above in mono uppercase at 0.62rem with 0.15em letter-spacing.

### Eyebrow label

Any small UPPERCASE mono-font label, 0.65-0.75rem, letter-spacing 0.15-0.2em, color `--text-dim` or colored for emphasis.

```tsx
<div className="
  font-mono text-[0.75rem] uppercase
  tracking-[0.2em]
  text-[var(--blue)]
  mb-4
">
  Zone 1 · Tonawanda East · May 2026
</div>
```

### Diamond logo mark

Iconic Darksteel brand mark. Uses a rotated 45° square with inset.

```html
<div class="w-6 h-6 bg-gradient-to-br from-[var(--blue)] to-[var(--red)] rotate-45 relative">
  <div class="absolute inset-[3px] bg-[var(--bg)]"></div>
</div>
```

Always pair with "DARKSTEEL MAIL" in Anton uppercase.

### Card

```tsx
<div className="
  bg-[var(--panel)]
  border border-[var(--border)]
  p-6
  hover:border-[var(--border-hot)]
  transition
">
```

No rounded corners or only 4px max.

---

## Motion

- **Page-load:** Staggered fade-up reveals using `animation-delay`. First element at 0, each subsequent at +100ms.
- **Hover:** 200ms ease. Transforms like `translateY(-2px)` or `translateX(4px)` on arrows.
- **Focus rings:** Box-shadow glow in `--blue-glow`, not outline.
- **CTAs:** Always have a hover glow using the blue-glow token.
- **Pulsing dot:** Small blue dot with `animation: pulse 2s ease-in-out infinite` for live/active indicators.

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```

- **Scroll reveals:** Use IntersectionObserver with `threshold: 0.12` and fade-up animation on reveal.

---

## Voice and copy

- **Direct.** No fluff, no "empower your business to leverage synergies."
- **Confident.** "You won't find cheaper targeted local reach." Not "One of the most affordable options."
- **Specific.** "5,000 homes, May 15th drop, $297 founding rate." Not "great reach at an amazing price."
- **Slightly dry.** The brand isn't peppy. It's professional with a small edge.
- **Never exclamation points.** Let the content do the work.

Example good copy:
> "Eight local businesses. One postcard. 5,000 homes. $297 founding rate — this drop only."

Example bad copy:
> "Boost your local business with our amazing community postcard program! Reach thousands of potential customers today!"

---

## What NOT to do

- **No purple gradients.** No "AI startup" purple anywhere.
- **No rounded pill buttons.** Square or 2-4px radius only.
- **No drop shadows on cards.** Use border color changes for depth.
- **No emoji in UI copy.** The design language is grown-up.
- **No "Get Started" or "Learn More" buttons.** Always specific: "Lock in this spot," "See the route map," "Book a call."
- **No generic stock photos.** No handshakes, no "business person pointing at graph."
- **No light mode.** This is a dark-only brand.

---

## Reference files

When in doubt, open these and pattern-match:

- `postcard-front-back.html` — color usage, type hierarchy, component density
- `postcard-live-demo.html` — form patterns, interactive states, button styles, preview panel
- `landing-page-original.html` — hero section, section transitions, pricing cards, grid background usage
