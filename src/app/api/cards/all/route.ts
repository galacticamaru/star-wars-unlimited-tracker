import { getAllCards } from "@/db/queries/catalog";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const cards = await getAllCards();
  const plainCards = cards.map(c => ({
    id: c.id,
    name: c.name,
    subtitle: c.subtitle,
    frontArtUrl: c.frontArtUrl,
    type: c.type,
  }));
  return NextResponse.json(plainCards);
}
