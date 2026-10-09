import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { BANK_CONFIGS } from "@/lib/parser";

export const dynamic = "force-dynamic";

const DEFAULT_ACCOUNTS = [
  { name: "wondr by BNI", bank: "wondr by BNI", color: "#f97316" },
  { name: "DANA", bank: "DANA", color: "#0284c7" },
  { name: "GoPay", bank: "GoPay", color: "#00aec6" },
  { name: "SeaBank", bank: "SeaBank", color: "#ea580c" },
  { name: "Bank Jago", bank: "Bank Jago", color: "#f59e0b" },
  { name: "ShopeePay", bank: "ShopeePay", color: "#ee4d2d" },
  { name: "bale by BTN", bank: "bale by BTN", color: "#2563eb" },
  { name: "OVO", bank: "OVO", color: "#7c3aed" },
];

export async function GET() {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Jika akun belum ada, buat akun default dari daftar pilihan user
  let accounts = await prisma.account.findMany();
  if (accounts.length === 0) {
    for (const def of DEFAULT_ACCOUNTS) {
      await prisma.account.create({
        data: {
          name: def.name,
          bank: def.bank,
          balance: 0,
          color: def.color,
        },
      });
    }
    accounts = await prisma.account.findMany();
  }

  const [thisMonthTx, recentTx, budgets, sakuList, tabunganList] = await Promise.all([
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

  const accountsWithFlow = accounts.map((acc) => {
    const accTxs = thisMonthTx.filter((t) => t.accountId === acc.id);
    const inc = accTxs.filter((t) => t.type === "IN").reduce((s, t) => s + t.amount, 0);
    const exp = accTxs.filter((t) => t.type === "OUT").reduce((s, t) => s + t.amount, 0);
    return {
      ...acc,
      monthIncome: inc,
      monthExpense: exp,
      icon: BANK_CONFIGS[acc.bank]?.icon || "💳",
      short: BANK_CONFIGS[acc.bank]?.short || acc.bank.slice(0, 4),
    };
  });

  return NextResponse.json({
    totalBalance,
    monthIncome,
    monthExpense,
    monthNet: monthIncome - monthExpense,
    accounts: accountsWithFlow,
    recentTransactions: recentTx,
    budgets,
    sakuList,
    tabunganList,
  });
}
