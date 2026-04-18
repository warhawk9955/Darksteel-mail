import { z } from "zod";

// Shared between the client form and the server route. Keep strict:
// the server re-validates every field even though the client also does.

export const AccentColor = z.enum([
  "blue",
  "red",
  "amber",
  "teal",
  "pink",
  "orange",
]);
export type AccentColor = z.infer<typeof AccentColor>;

export const ClaimSchema = z.object({
  spotId: z.string().uuid(),
  categoryId: z.string().uuid(),
  businessName: z.string().trim().min(2).max(80),
  contactEmail: z.string().trim().email().max(200),
  offer: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(40),
  url: z.string().trim().min(3).max(200),
  accentColor: AccentColor,
});

export type Claim = z.infer<typeof ClaimSchema>;

export const ACCENT_COLOR_HEX: Record<AccentColor, string> = {
  blue: "#00aaff",
  red: "#ff2244",
  amber: "#ffaa00",
  teal: "#00ccaa",
  pink: "#ff88ee",
  orange: "#ff8866",
};
