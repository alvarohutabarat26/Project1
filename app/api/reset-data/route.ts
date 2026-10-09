import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // 1. Hapus semua riwayat transaksi
    await prisma.transaction.deleteMany();

    // 2. Reset saldo semua akun bank/e-wallet ke 0
    await prisma.account.updateMany({
      data: { balance: 0 },
    });

    // 3. Reset pengeluaran budget
    await prisma.budget.updateMany({
      data: { spentAmount: 0 },
    });

    // 4. Reset saku
    await prisma.saku.updateMany({
      data: { spentAmount: 0 },
    });

    // 5. Reset setoran tabungan
    await prisma.setoran.deleteMany();
    await prisma.tabungan.updateMany({
      data: { currentAmount: 0 },
    });

    // 6. Hapus debug log webhook
    await prisma.settings.deleteMany({
      where: { key: { startsWith: "webhook_debug_" } },
    });

    return NextResponse.json({ success: true, message: "Semua data transaksi berhasil dibersihkan!" });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json({ error: "Gagal membersihkan data" }, { status: 500 });
  }
}
