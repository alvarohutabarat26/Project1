import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  await prisma.settings.deleteMany({
    where: { key: "pin_hash" },
  });
  return NextResponse.json({ success: true, message: "PIN reset successfully" });
}
