import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseSmsBank, extractSourceBank } from "@/lib/parser";

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

    // 1.5 Auto-pair transaksi masuk yang menyebutkan bank sumber (contoh: "via BNI") jika belum ada transaksi keluar
    const currentTxs = await prisma.transaction.findMany({
      include: { account: true },
    });
    for (const tx of currentTxs) {
      if (tx.type !== "IN" || !tx.rawText) continue;
      const sourceBankName = extractSourceBank(tx.rawText);
      if (!sourceBankName || sourceBankName === tx.account?.bank) continue;

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

      const hasOut = currentTxs.some(
        (o) =>
          o.type === "OUT" &&
          o.accountId === sourceAccount!.id &&
          o.amount === tx.amount &&
          Math.abs(new Date(o.createdAt).getTime() - new Date(tx.createdAt).getTime()) < 10 * 60 * 1000
      );

      if (!hasOut) {
        await prisma.transaction.create({
          data: {
            amount: tx.amount,
            type: "OUT",
            description: `${sourceBankName}: Transfer / Top up ke ${tx.account?.name || "e-Wallet"}`,
            rawText: `Auto-paired dari: ${tx.rawText}`,
            notes: "auto-pair",
            accountId: sourceAccount.id,
            createdAt: tx.createdAt,
          },
        });
      }
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
