import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/transactions
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = parseInt(searchParams.get("skip") || "0");
  const type = searchParams.get("type"); // "IN" | "OUT"
  const categoryId = searchParams.get("categoryId");
  const month = searchParams.get("month"); // "2024-10"

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (categoryId) where.categoryId = categoryId;
  if (month) {
    const [year, m] = month.split("-");
    const start = new Date(parseInt(year), parseInt(m) - 1, 1);
    const end = new Date(parseInt(year), parseInt(m), 1);
    where.createdAt = { gte: start, lt: end };
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true, account: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({ transactions, total });
}

// POST /api/transactions
export async function POST(req: NextRequest) {
  const data = await req.json();

  const transaction = await prisma.transaction.create({
    data: {
      amount: data.amount,
      type: data.type,
      description: data.description || "",
      notes: data.notes || "",
      categoryId: data.categoryId || null,
      accountId: data.accountId || null,
      sakuId: data.sakuId || null,
    },
    include: { category: true, account: true },
  });

  // Update account balance
  if (data.accountId) {
    const delta = data.type === "IN" ? data.amount : -data.amount;
    await prisma.account.update({
      where: { id: data.accountId },
      data: { balance: { increment: delta } },
    });
  }

  // Update budget
  if (data.categoryId && data.type === "OUT") {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    await prisma.budget.updateMany({
      where: { categoryId: data.categoryId, month },
      data: { spentAmount: { increment: data.amount } },
    });
  }

  // Update saku
  if (data.sakuId && data.type === "OUT") {
    await prisma.saku.update({
      where: { id: data.sakuId },
      data: { spentAmount: { increment: data.amount } },
    });
  }

  return NextResponse.json(transaction);
}
