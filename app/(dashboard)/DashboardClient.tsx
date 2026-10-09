"use client";
import { useEffect, useState } from "react";
import { formatRupiah, formatDatetime } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft, Building2 } from "lucide-react";
import Link from "next/link";

interface AccountItem {
  id: string;
  name: string;
  bank: string;
  balance: number;
  color: string;
  monthIncome: number;
  monthExpense: number;
  icon?: string;
  short?: string;
}

interface DashboardData {
  totalBalance: number;
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
  accounts: AccountItem[];
  recentTransactions: {
    id: string;
    amount: number;
    type: string;
    description: string;
    createdAt: string;
    category?: { name: string; color: string } | null;
    account?: { name: string; bank: string } | null;
  }[];
  sakuList: { id: string; name: string; allocatedAmount: number; spentAmount: number; color: string }[];
  tabunganList: { id: string; name: string; targetAmount: number; currentAmount: number; color: string }[];
}

export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/dashboard");
      const d = await res.json();
      setData(d);
    } catch {
      // ignore
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    // Auto-refresh setiap 4 detik agar transaksi masuk real-time
    const interval = setInterval(refreshData, 4000);
    return () => clearInterval(interval);
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
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Beranda</h1>
          <p className="text-slate-400 text-sm">Ringkasan keuangan & e-wallet kamu</p>
        </div>
        <button
          onClick={refreshData}
          disabled={isRefreshing}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all text-xs flex items-center gap-1.5"
          title="Muat Ulang"
        >
          <span className={isRefreshing ? "animate-spin" : ""}>🔄</span> Refresh
        </button>
      </div>

      {/* Total Balance Card */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-6 text-white shadow-xl border border-indigo-500/20">
        <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider mb-1">Total Saldo Tergabung</p>
        <p className="text-4xl font-extrabold tracking-tight">{formatRupiah(data.totalBalance)}</p>
        <p className="text-indigo-200/80 text-xs mt-2">
          Terhubung dengan {data.accounts.length} rekening bank & e-wallet
        </p>
      </div>

      {/* Month Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownLeft size={16} className="text-emerald-400" />
            <span className="text-slate-400 text-xs">Total Masuk</span>
          </div>
          <p className="text-emerald-400 font-bold text-lg">{formatRupiah(data.monthIncome)}</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight size={16} className="text-red-400" />
            <span className="text-slate-400 text-xs">Total Keluar</span>
          </div>
          <p className="text-red-400 font-bold text-lg">{formatRupiah(data.monthExpense)}</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            {data.monthNet >= 0
              ? <TrendingUp size={16} className="text-indigo-400" />
              : <TrendingDown size={16} className="text-orange-400" />
            }
            <span className="text-slate-400 text-xs">Selisih Bulan Ini</span>
          </div>
          <p className={`font-bold text-lg ${data.monthNet >= 0 ? "text-indigo-400" : "text-orange-400"}`}>
            {formatRupiah(data.monthNet)}
          </p>
        </div>
      </div>

      {/* REKENING & E-WALLET BREAKDOWN (FITUR UTAMA SESUAI PERMINTAAN USER) */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Building2 size={18} className="text-indigo-400" /> Rekening & E-Wallet
          </h2>
          <span className="text-xs text-slate-400">{data.accounts.length} Aplikasi Terpantau</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {data.accounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all shadow-sm flex flex-col justify-between"
            >
              {/* Bank Header */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black tracking-wide shadow"
                  style={{ backgroundColor: acc.color + "25", color: acc.color, border: `1px solid ${acc.color}45` }}
                >
                  {acc.short || acc.bank.slice(0, 3)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-bold truncate leading-tight">{acc.name}</p>
                  <p className="text-slate-400 text-xs mt-0.5 font-medium">Saldo: {formatRupiah(acc.balance)}</p>
                </div>
              </div>

              {/* Uang Masuk & Uang Keluar */}
              <div className="bg-slate-950/70 rounded-xl p-2.5 space-y-1.5 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                    <ArrowDownLeft size={13} className="text-emerald-400" /> Uang Masuk
                  </span>
                  <span className="text-emerald-400 font-bold text-[11px]">
                    +{formatRupiah(acc.monthIncome || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                    <ArrowUpRight size={13} className="text-red-400" /> Uang Keluar
                  </span>
                  <span className="text-red-400 font-bold text-[11px]">
                    -{formatRupiah(acc.monthExpense || 0)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Saku (Envelope Budgeting) */}
      {data.sakuList.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Wallet size={16} className="text-indigo-400" /> Saku Alokasi Dana
            </h2>
            <Link href="/saku" className="text-indigo-400 text-sm hover:underline">Lihat semua</Link>
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
              🐷 Target Tabungan
            </h2>
            <Link href="/tabungan" className="text-indigo-400 text-sm hover:underline">Lihat semua</Link>
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
          <h2 className="font-semibold text-white">Riwayat Transaksi Terbaru</h2>
          <Link href="/transactions" className="text-indigo-400 text-sm hover:underline">Lihat semua</Link>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 divide-y divide-slate-800">
          {data.recentTransactions.length === 0 && (
            <div className="p-6 text-center text-slate-500">
              Belum ada transaksi. Notifikasi dari MacroDroid akan otomatis muncul di sini!
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
                <p className="text-sm text-slate-200 truncate font-medium">{tx.description || "Transaksi"}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-slate-500">{formatDatetime(tx.createdAt)}</p>
                  {tx.account && (
                    <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-medium">
                      {tx.account.bank}
                    </span>
                  )}
                </div>
              </div>
              {tx.category && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full hidden sm:block font-medium"
                  style={{ backgroundColor: tx.category.color + "30", color: tx.category.color }}
                >
                  {tx.category.name}
                </span>
              )}
              <p className={`text-sm font-bold flex-shrink-0 ${tx.type === "IN" ? "text-emerald-400" : "text-red-400"}`}>
                {tx.type === "IN" ? "+" : "-"}{formatRupiah(tx.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
