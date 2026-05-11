import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getUserTradeData } from "@/db/queries/trade";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userId = parseInt(session.user.id);
  if (isNaN(userId)) {
    return new NextResponse("Invalid User ID", { status: 400 });
  }

  const data = await getUserTradeData(userId);

  return NextResponse.json(data);
}
