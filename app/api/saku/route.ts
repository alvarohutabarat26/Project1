import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const saku = await prisma.saku.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(saku);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const saku = await prisma.saku.create({
    data: {
      name: data.name,
      allocatedAmount: data.allocatedAmount || 0,
      color: data.color || "#6366f1",
      icon: data.icon || "wallet",
    },
  });
  return NextResponse.json(saku);
}
