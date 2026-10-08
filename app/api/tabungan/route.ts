import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const tabungan = await prisma.tabungan.findMany({
    include: { setoran: { orderBy: { createdAt: "desc" }, take: 5 } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(tabungan);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const tabungan = await prisma.tabungan.create({
    data: {
      name: data.name,
      targetAmount: data.targetAmount,
      deadline: data.deadline ? new Date(data.deadline) : null,
      color: data.color || "#6366f1",
      icon: data.icon || "piggy-bank",
    },
  });
  return NextResponse.json(tabungan);
}
