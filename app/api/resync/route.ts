import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseSmsBank } from "@/lib/parser";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const transactions = await prisma.transaction.findMany();

    // 1. Re-parse each transaction
    for (const tx of transactions) {
      if (!tx.rawText) continue;
      const parsed = parseSmsBank(tx.rawText);
      if (!parsed) continue;

      // Find or create correct account
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

      await prisma.transaction.update({
        where: { id: tx.id },
        data: {
          type: parsed.type,
          amount: parsed.amount,
          description: parsed.description,
          accountId: targetAccount.id,
        },
      });
    }

    // 2. Recalculate balance for all accounts from clean sum
    const accounts = await prisma.account.findMany();
    for (const acc of accounts) {
      const txs = await prisma.transaction.findMany({
        where: { accountId: acc.id },
      });
      const newBalance = txs.reduce((sum, t) => {
        return sum + (t.type === "IN" ? t.amount : -t.amount);
      }, 0);

      await prisma.account.update({
        where: { id: acc.id },
        data: { balance: newBalance },
      });
    }

    return NextResponse.json({ success: true, message: "Semua transaksi berhasil disinkronkan ulang!" });
  } catch (error) {
    console.error("Resync error:", error);
    return NextResponse.json({ error: "Gagal sinkronisasi data" }, { status: 500 });
  }
}
