import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const accounts = await prisma.account.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(accounts);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const account = await prisma.account.create({
    data: {
      name: data.name,
      bank: data.bank,
      balance: data.balance || 0,
      color: data.color || "#6366f1",
    },
  });
  return NextResponse.json(account);
}
