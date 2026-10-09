import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseSmsBank, autoCategory, extractSourceBank } from "@/lib/parser";

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
    try {
      rawText = await req.text();
    } catch {
      rawText = "";
    }

    rawText = (rawText || "").trim();

    let appHint = req.nextUrl.searchParams.get("app") || req.nextUrl.searchParams.get("bank") || "";

    // Jika formatnya JSON, ekstrak field text dan app/title
    if (rawText.startsWith("{") && rawText.endsWith("}")) {
      try {
        const body = JSON.parse(rawText);
        if (typeof body === "object" && body !== null) {
          appHint = body.app || body.appName || body.bank || body.package || body.title || appHint;
          rawText = body.text || body.message || body.sms || body.notif || rawText;
        }
      } catch {
        // Gunakan rawText langsung
      }
    }

    if (!rawText) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // Parse teks notifikasi / SMS dengan appHint
    const parsed = parseSmsBank(rawText, appHint);
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

    // Jika transaksi adalah OUT dan sebelumnya sudah pernah dibuat secara auto-pair:
    // cukup perbarui keterangannya agar tidak menduplikasi pemotongan saldo.
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (parsed.type === "OUT") {
      const existingAutoOut = await prisma.transaction.findFirst({
        where: {
          accountId: targetAccount.id,
          type: "OUT",
          amount: parsed.amount,
          createdAt: { gte: fiveMinutesAgo },
          notes: { contains: "auto-pair" },
        },
      });

      if (existingAutoOut) {
        await prisma.transaction.update({
          where: { id: existingAutoOut.id },
          data: {
            description: parsed.description,
            rawText,
            notes: "",
          },
        });
        return NextResponse.json({ success: true, transaction: existingAutoOut, updatedAutoPair: true });
      }
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

    // Auto-pair untuk top up via bank lain (misal: "Top up via BNI", "dari BNI")
    if (parsed.type === "IN") {
      const sourceBankName = extractSourceBank(rawText);
      if (sourceBankName && sourceBankName !== targetAccount.bank) {
        let sourceAccount = await prisma.account.findFirst({
          where: {
            OR: [
              { bank: { equals: sourceBankName } },
              { name: { equals: sourceBankName } },
            ],
          },
        });

        if (!sourceAccount) {
          sourceAccount = await prisma.account.create({
            data: {
              name: sourceBankName,
              bank: sourceBankName,
              balance: 0,
              color: "#f97316",
            },
          });
        }

        const existingOut = await prisma.transaction.findFirst({
          where: {
            accountId: sourceAccount.id,
            type: "OUT",
            amount: parsed.amount,
            createdAt: { gte: fiveMinutesAgo },
          },
        });

        if (!existingOut) {
          await prisma.transaction.create({
            data: {
              amount: parsed.amount,
              type: "OUT",
              description: `${sourceBankName}: Transfer / Top up ke ${targetAccount.name}`,
              rawText: `Auto-paired dari: ${rawText}`,
              notes: "auto-pair",
              accountId: sourceAccount.id,
            },
          });

          await prisma.account.update({
            where: { id: sourceAccount.id },
            data: { balance: { decrement: parsed.amount } },
          });
        }
      }
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
