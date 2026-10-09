import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { account: true, category: true },
  });

  const settings = await prisma.settings.findMany({
    where: { key: { startsWith: "webhook_debug_" } },
    take: 10,
  });

  return NextResponse.json({ transactions, debugLogs: settings });
}
