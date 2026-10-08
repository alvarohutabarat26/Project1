import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/tabungan/[id]/setoran
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();

  const setoran = await prisma.setoran.create({
    data: {
      tabunganId: id,
      amount: data.amount,
      notes: data.notes || "",
    },
  });

  await prisma.tabungan.update({
    where: { id },
    data: { currentAmount: { increment: data.amount } },
  });

  return NextResponse.json(setoran);
}
