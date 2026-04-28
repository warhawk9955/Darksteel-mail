import Link from "next/link";
import { notFound } from "next/navigation";
import { serviceClient } from "@/lib/supabase/server";
import { getCardForZone, listCardLayouts } from "@/lib/db/cards";
import CardBuilder from "@/app/setup/_components/CardBuilder";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ zoneId: string }>;
}

export default async function CardEditorPage({ params }: PageProps) {
  const { zoneId } = await params;
  const svc = serviceClient();
  const [card, layouts] = await Promise.all([
    getCardForZone(svc, zoneId),
    listCardLayouts(svc),
  ]);
  if (!card) notFound();

  return (
    <div>
      <Link
        href="/admin/cards"
        className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-text-dim hover:text-white transition inline-flex items-center gap-2 mb-6"
      >
        <span aria-hidden>←</span> All cards
      </Link>

      <div className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-blue mb-3">
        Card editor
      </div>
      <h1 className="font-display text-3xl tracking-[0.04em] uppercase mb-3">
        {card.zone_name}
      </h1>
      <p className="font-body text-text-dim mb-10">
        Layout: {card.layout_name ?? "none"} · {card.spots.length} slots
      </p>

      <CardBuilder card={card} layouts={layouts} mode="admin" />
    </div>
  );
}
