"use client";
import { useEffect, useState } from "react";
import { formatRupiah, formatDatetime } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import Link from "next/link";

interface DashboardData {
  totalBalance: number;
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
  accounts: { id: string; name: string; bank: string; balance: number; color: string }[];
  recentTransactions: {
    id: string;
    amount: number;
    type: string;
    description: string;
    createdAt: string;
    category?: { name: string; color: string } | null;
  }[];
  sakuList: { id: string; name: string; allocatedAmount: number; spentAmount: number; color: string }[];
  tabunganList: { id: string; name: string; targetAmount: number; currentAmount: number; color: string }[];
}

export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Beranda</h1>
        <p className="text-slate-400 text-sm">Ringkasan keuanganmu</p>
      </div>

      {/* Total Balance */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-lg">
        <p className="text-indigo-200 text-sm mb-1">Total Saldo</p>
        <p className="text-4xl font-bold">{formatRupiah(data.totalBalance)}</p>
        <div className="flex gap-4 mt-4">
          {data.accounts.map((acc) => (
            <div key={acc.id} className="text-sm">
              <p className="text-indigo-200">{acc.bank}</p>
              <p className="font-semibold">{formatRupiah(acc.balance)}</p>
            </div>
          ))}
          {data.accounts.length === 0 && (
            <Link href="/settings" className="text-indigo-200 text-sm underline">
              + Tambah rekening
            </Link>
          )}
        </div>
      </div>

      {/* Month Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownLeft size={16} className="text-emerald-400" />
            <span className="text-slate-400 text-xs">Masuk</span>
          </div>
          <p className="text-emerald-400 font-bold text-lg">{formatRupiah(data.monthIncome)}</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight size={16} className="text-red-400" />
            <span className="text-slate-400 text-xs">Keluar</span>
          </div>
          <p className="text-red-400 font-bold text-lg">{formatRupiah(data.monthExpense)}</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            {data.monthNet >= 0
              ? <TrendingUp size={16} className="text-indigo-400" />
              : <TrendingDown size={16} className="text-orange-400" />
            }
            <span className="text-slate-400 text-xs">Selisih</span>
          </div>
          <p className={`font-bold text-lg ${data.monthNet >= 0 ? "text-indigo-400" : "text-orange-400"}`}>
            {formatRupiah(data.monthNet)}
          </p>
        </div>
      </div>

      {/* Saku */}
      {data.sakuList.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Wallet size={16} className="text-indigo-400" /> Saku
            </h2>
            <Link href="/saku" className="text-indigo-400 text-sm">Lihat semua</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {data.sakuList.slice(0, 3).map((s) => {
              const sisa = s.allocatedAmount - s.spentAmount;
              const pct = s.allocatedAmount > 0 ? (s.spentAmount / s.allocatedAmount) * 100 : 0;
              return (
                <div key={s.id} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-sm text-slate-300 font-medium">{s.name}</span>
                  </div>
                  <p className="text-white font-bold">{formatRupiah(sisa)}</p>
                  <p className="text-slate-500 text-xs">sisa dari {formatRupiah(s.allocatedAmount)}</p>
                  <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-yellow-500" : "bg-emerald-500"}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabungan */}
      {data.tabunganList.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-white flex items-center gap-2">
              🐷 Tabungan
            </h2>
            <Link href="/tabungan" className="text-indigo-400 text-sm">Lihat semua</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.tabunganList.slice(0, 2).map((t) => {
              const pct = (t.currentAmount / t.targetAmount) * 100;
              return (
                <div key={t.id} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-slate-300 font-medium">{t.name}</span>
                    <span className="text-xs text-slate-500">{Math.round(pct)}%</span>
                  </div>
                  <p className="text-white font-bold">{formatRupiah(t.currentAmount)}</p>
                  <p className="text-slate-500 text-xs">dari {formatRupiah(t.targetAmount)}</p>
                  <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all"
                      style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: t.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transaksi Terbaru */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-white">Transaksi Terbaru</h2>
          <Link href="/transactions" className="text-indigo-400 text-sm">Lihat semua</Link>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 divide-y divide-slate-800">
          {data.recentTransactions.length === 0 && (
            <div className="p-6 text-center text-slate-500">
              Belum ada transaksi. Setup webhook untuk mulai!
            </div>
          )}
          {data.recentTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 p-4">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                tx.type === "IN" ? "bg-emerald-500/20" : "bg-red-500/20"
              }`}>
                {tx.type === "IN"
                  ? <ArrowDownLeft size={16} className="text-emerald-400" />
                  : <ArrowUpRight size={16} className="text-red-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 truncate">{tx.description || "Transaksi"}</p>
                <p className="text-xs text-slate-500">{formatDatetime(tx.createdAt)}</p>
              </div>
              {tx.category && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full hidden sm:block"
                  style={{ backgroundColor: tx.category.color + "30", color: tx.category.color }}
                >
                  {tx.category.name}
                </span>
              )}
              <p className={`text-sm font-semibold flex-shrink-0 ${tx.type === "IN" ? "text-emerald-400" : "text-red-400"}`}>
                {tx.type === "IN" ? "+" : "-"}{formatRupiah(tx.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
