import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || "";

  const budgets = await prisma.budget.findMany({
    where: month ? { month } : undefined,
    include: { category: true },
    orderBy: { category: { name: "asc" } },
  });
  return NextResponse.json(budgets);
}

export async function POST(req: NextRequest) {
  const data = await req.json();

  // Upsert: kalau sudah ada di bulan itu, update limitnya
  const budget = await prisma.budget.upsert({
    where: { categoryId_month: { categoryId: data.categoryId, month: data.month } },
    update: { limitAmount: data.limitAmount },
    create: {
      categoryId: data.categoryId,
      month: data.month,
      limitAmount: data.limitAmount,
    },
    include: { category: true },
  });

  return NextResponse.json(budget);
}
