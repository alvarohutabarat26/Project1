import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const category = await prisma.category.create({
    data: {
      name: data.name,
      color: data.color || "#6366f1",
      icon: data.icon || "tag",
      keywords: data.keywords || "",
    },
  });
  return NextResponse.json(category);
}
