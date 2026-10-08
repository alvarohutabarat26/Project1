import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getLast6Months } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const months = getLast6Months();

  const data = await Promise.all(
    months.map(async (month) => {
      const [year, m] = month.split("-");
      const start = new Date(parseInt(year), parseInt(m) - 1, 1);
      const end = new Date(parseInt(year), parseInt(m), 1);

      const txs = await prisma.transaction.findMany({
        where: { createdAt: { gte: start, lt: end } },
      });

      const income = txs.filter((t) => t.type === "IN").reduce((s, t) => s + t.amount, 0);
      const expense = txs.filter((t) => t.type === "OUT").reduce((s, t) => s + t.amount, 0);

      return { month, income, expense };
    })
  );

  // Category breakdown for current month
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const outTxs = await prisma.transaction.findMany({
    where: { type: "OUT", createdAt: { gte: start, lt: end } },
    include: { category: true },
  });

  const categoryMap: Record<string, { name: string; color: string; total: number }> = {};
  for (const tx of outTxs) {
    const key = tx.categoryId || "uncategorized";
    const name = tx.category?.name || "Lainnya";
    const color = tx.category?.color || "#94a3b8";
    if (!categoryMap[key]) categoryMap[key] = { name, color, total: 0 };
    categoryMap[key].total += tx.amount;
  }

  return NextResponse.json({
    monthly: data,
    categoryBreakdown: Object.values(categoryMap),
  });
}
