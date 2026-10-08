import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/dashboard
export async function GET() {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [accounts, thisMonthTx, recentTx, budgets, sakuList, tabunganList] = await Promise.all([
    prisma.account.findMany(),
    prisma.transaction.findMany({
      where: { createdAt: { gte: startOfMonth, lt: endOfMonth } },
    }),
    prisma.transaction.findMany({
      include: { category: true, account: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.budget.findMany({
      where: { month },
      include: { category: true },
    }),
    prisma.saku.findMany(),
    prisma.tabungan.findMany(),
  ]);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const monthIncome = thisMonthTx.filter((t) => t.type === "IN").reduce((s, t) => s + t.amount, 0);
  const monthExpense = thisMonthTx.filter((t) => t.type === "OUT").reduce((s, t) => s + t.amount, 0);

  return NextResponse.json({
    totalBalance,
    monthIncome,
    monthExpense,
    monthNet: monthIncome - monthExpense,
    accounts,
    recentTransactions: recentTx,
    budgets,
    sakuList,
    tabunganList,
  });
}
