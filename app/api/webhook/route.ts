import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseSmsBank, autoCategory } from "@/lib/parser";

export async function POST(req: NextRequest) {
  // Validasi webhook secret
  const authHeader = req.headers.get("authorization");
  const secret = process.env.WEBHOOK_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const rawText: string = body.text || body.message || body.sms || "";

    if (!rawText) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // Parse teks SMS
    const parsed = parseSmsBank(rawText);
    if (!parsed || parsed.amount <= 0) {
      return NextResponse.json(
        { error: "Could not parse transaction from text", rawText },
        { status: 422 }
      );
    }

    // Auto-kategorisasi
    const categories = await prisma.category.findMany();
    const categoryId = autoCategory(parsed.description, categories);

    // Ambil akun pertama (default)
    const defaultAccount = await prisma.account.findFirst();

    // Buat transaksi
    const transaction = await prisma.transaction.create({
      data: {
        amount: parsed.amount,
        type: parsed.type,
        description: parsed.description,
        rawText,
        categoryId,
        accountId: defaultAccount?.id || null,
      },
    });

    // Update saldo akun
    if (defaultAccount) {
      const delta = parsed.type === "IN" ? parsed.amount : -parsed.amount;
      await prisma.account.update({
        where: { id: defaultAccount.id },
        data: { balance: { increment: delta } },
      });
    }

    // Update budget jika ada kategori & transaksi keluar
    if (categoryId && parsed.type === "OUT") {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      await prisma.budget.updateMany({
        where: { categoryId, month },
        data: { spentAmount: { increment: parsed.amount } },
      });
    }

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
