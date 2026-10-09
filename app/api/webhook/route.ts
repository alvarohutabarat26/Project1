import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseSmsBank, autoCategory } from "@/lib/parser";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Validasi webhook secret (bisa lewat Header Authorization ATAU Query Param ?token=)
  const authHeader = req.headers.get("authorization") || "";
  const queryToken = req.nextUrl.searchParams.get("token") || "";
  const secret = process.env.WEBHOOK_SECRET || "finansialku-secret-12345";

  const isAuthorized =
    authHeader === `Bearer ${secret}` ||
    authHeader === secret ||
    queryToken === secret ||
    authHeader.toLowerCase().includes(secret.toLowerCase());

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let rawText = "";
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      try {
        const body = await req.json();
        rawText = body.text || body.message || body.sms || body.notif || "";
        if (!rawText && typeof body === "string") rawText = body;
      } catch {
        rawText = await req.text();
      }
    } else {
      rawText = await req.text();
    }

    // Bersihkan jika terbungkus kutip JSON
    rawText = rawText.trim();
    if (rawText.startsWith('{"text":"') && rawText.endsWith('"}')) {
      try {
        const parsedJson = JSON.parse(rawText);
        rawText = parsedJson.text || rawText;
      } catch {
        // Abaikan
      }
    }

    if (!rawText) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // Parse teks notifikasi / SMS
    const parsed = parseSmsBank(rawText);
    if (!parsed || parsed.amount <= 0) {
      try {
        await prisma.settings.create({
          data: {
            key: `webhook_debug_${Date.now()}`,
            value: rawText.slice(0, 500),
          },
        });
      } catch {}
      return NextResponse.json(
        { error: "Could not parse transaction from text", rawText },
        { status: 422 }
      );
    }

    // Auto-kategorisasi
    const categories = await prisma.category.findMany();
    const categoryId = autoCategory(parsed.description, categories);

    // Temukan atau buat akun rekening/e-wallet untuk bank ini
    let targetAccount = await prisma.account.findFirst({
      where: {
        OR: [
          { bank: { equals: parsed.bank } },
          { name: { equals: parsed.bank } },
        ],
      },
    });

    if (!targetAccount) {
      targetAccount = await prisma.account.create({
        data: {
          name: parsed.bank,
          bank: parsed.bank,
          balance: 0,
          color: "#6366f1",
        },
      });
    }

    // Buat transaksi
    const transaction = await prisma.transaction.create({
      data: {
        amount: parsed.amount,
        type: parsed.type,
        description: parsed.description,
        rawText,
        categoryId,
        accountId: targetAccount.id,
      },
    });

    // Update saldo akun
    const delta = parsed.type === "IN" ? parsed.amount : -parsed.amount;
    await prisma.account.update({
      where: { id: targetAccount.id },
      data: { balance: { increment: delta } },
    });

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
