import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createSession, deleteSession } from "@/lib/auth";

// POST /api/auth/login
export async function POST(req: NextRequest) {
  const { pin } = await req.json();

  if (!pin) {
    return NextResponse.json({ error: "PIN required" }, { status: 400 });
  }

  // Ambil hash PIN dari settings
  const setting = await prisma.settings.findUnique({ where: { key: "pin_hash" } });

  // Jika belum ada PIN (first time), langsung set
  if (!setting) {
    const hash = await bcrypt.hash(pin, 10);
    await prisma.settings.create({ data: { key: "pin_hash", value: hash } });
    await createSession();
    return NextResponse.json({ success: true, firstTime: true });
  }

  const valid = await bcrypt.compare(pin, setting.value);
  if (!valid) {
    return NextResponse.json({ error: "PIN salah" }, { status: 401 });
  }

  await createSession();
  return NextResponse.json({ success: true });
}

// PUT /api/auth/login (reset PIN)
export async function PUT() {
  await prisma.settings.deleteMany({ where: { key: "pin_hash" } });
  return NextResponse.json({ success: true });
}

// DELETE /api/auth/login (logout)
export async function DELETE() {
  await deleteSession();
  return NextResponse.json({ success: true });
}
