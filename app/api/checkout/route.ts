import { NextResponse } from "next/server";
import { ClaimSchema } from "@/lib/validation/claim";

// STUB for commit 5.
// Real Stripe session creation lands in commit 6.
// We still validate the body end-to-end so the client form contract
// is nailed down before the checkout endpoint goes live.

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const parsed = ClaimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation_failed",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      error: "not_implemented",
      message:
        "Checkout endpoint wires up in commit 6. Form payload validated successfully.",
      echo: parsed.data,
    },
    { status: 501 },
  );
}
