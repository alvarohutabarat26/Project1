"use client";
import { useEffect, useState } from "react";
import { formatRupiah, getMonthLabel } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Building2, ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface Account {
  id: string;
  name: string;
  bank: string;
  color: string;
}

interface AnalyticsData {
  monthly: { month: string; income: number; expense: number }[];
  categoryBreakdown: { name: string; color: string; total: number }[];
  accounts: Account[];
}

const formatK = (val: number) => {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}jt`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}rb`;
  return val.toString();
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async (accId: string) => {
    setLoading(true);
    try {
      const url = accId === "all" ? "/api/analytics" : `/api/analytics?accountId=${accId}`;
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selectedAccountId);
  }, [selectedAccountId]);

  if (!data && loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const chartData = (data?.monthly || []).map((m) => ({
    name: getMonthLabel(m.month).split(" ")[0],
    Masuk: m.income,
    Keluar: m.expense,
  }));

  const totalExpense = (data?.categoryBreakdown || []).reduce((s, c) => s + c.total, 0);
  const totalIncomeAll = (data?.monthly || []).reduce((s, m) => s + m.income, 0);
  const totalExpenseAll = (data?.monthly || []).reduce((s, m) => s + m.expense, 0);

  const selectedAccountName =
    selectedAccountId === "all"
      ? "Semua Bank & E-Wallet"
      : data?.accounts.find((a) => a.id === selectedAccountId)?.name || "Akun Terpilih";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analitik</h1>
          <p className="text-slate-400 text-sm">Visualisasi keuangan 6 bulan terakhir</p>
        </div>

        {/* Bank / E-Wallet Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-indigo-400 flex-shrink-0" />
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-sm font-medium rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
          >
            <option value="all">🌐 Semua Bank & E-Wallet</option>
            {(data?.accounts || []).map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Account Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-1.5 mb-1.5">
            <ArrowDownLeft size={15} className="text-emerald-400" />
            <span className="text-slate-400 text-xs">Total Masuk (6 Bln)</span>
          </div>
          <p className="text-emerald-400 font-bold text-lg">{formatRupiah(totalIncomeAll)}</p>
          <p className="text-[10px] text-slate-500 mt-0.5 truncate">{selectedAccountName}</p>
        </div>

        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-1.5 mb-1.5">
            <ArrowUpRight size={15} className="text-red-400" />
            <span className="text-slate-400 text-xs">Total Keluar (6 Bln)</span>
          </div>
          <p className="text-red-400 font-bold text-lg">{formatRupiah(totalExpenseAll)}</p>
          <p className="text-[10px] text-slate-500 mt-0.5 truncate">{selectedAccountName}</p>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-slate-900 rounded-xl p-4 border border-slate-800">
          <span className="text-slate-400 text-xs block mb-1.5">Selisih Bersih</span>
          <p
            className={`font-bold text-lg ${
              totalIncomeAll - totalExpenseAll >= 0 ? "text-indigo-400" : "text-orange-400"
            }`}
          >
            {formatRupiah(totalIncomeAll - totalExpenseAll)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5 truncate">{selectedAccountName}</p>
        </div>
      </div>

      {/* Bar Chart: Pemasukan vs Pengeluaran */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-white">
            Pemasukan vs Pengeluaran — <span className="text-indigo-400">{selectedAccountName}</span>
          </h2>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatK} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(val: any) => formatRupiah(Number(val) || 0)}
              contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "12px" }}
              labelStyle={{ color: "#94a3b8" }}
            />
            <Bar dataKey="Masuk" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Keluar" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart: Pengeluaran per Kategori */}
      {(data?.categoryBreakdown || []).length > 0 ? (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
          <h2 className="font-semibold text-white mb-4">
            Pengeluaran Bulan Ini per Kategori — <span className="text-indigo-400">{selectedAccountName}</span>
          </h2>
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={data?.categoryBreakdown}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {(data?.categoryBreakdown || []).map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => formatRupiah(Number(val) || 0)}
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 flex-1">
              {(data?.categoryBreakdown || []).map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-sm text-slate-300">{c.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{formatRupiah(c.total)}</p>
                    <p className="text-xs text-slate-500">
                      {totalExpense > 0 ? ((c.total / totalExpense) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-10 text-center text-slate-500">
          Belum ada pengeluaran berkategori untuk <span className="text-slate-400">{selectedAccountName}</span> di bulan ini.
        </div>
      )}
    </div>
  );
}
