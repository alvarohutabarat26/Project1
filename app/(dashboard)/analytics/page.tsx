"use client";
import { useEffect, useState } from "react";
import { formatRupiah, getMonthLabel, getLast6Months } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

interface AnalyticsData {
  monthly: { month: string; income: number; expense: number }[];
  categoryBreakdown: { name: string; color: string; total: number }[];
}

const formatK = (val: number) => {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}jt`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}rb`;
  return val.toString();
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
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

  const chartData = data.monthly.map((m) => ({
    name: getMonthLabel(m.month).split(" ")[0], // only month name
    Masuk: m.income,
    Keluar: m.expense,
  }));

  const totalExpense = data.categoryBreakdown.reduce((s, c) => s + c.total, 0);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Analitik</h1>
        <p className="text-slate-400 text-sm">Visualisasi keuangan 6 bulan terakhir</p>
      </div>

      {/* Bar Chart */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
        <h2 className="font-semibold text-white mb-4">Pemasukan vs Pengeluaran</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatK} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(val: number) => formatRupiah(val)}
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "12px" }}
              labelStyle={{ color: "#94a3b8" }}
            />
            <Bar dataKey="Masuk" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Keluar" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      {data.categoryBreakdown.length > 0 && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
          <h2 className="font-semibold text-white mb-4">Pengeluaran Bulan Ini per Kategori</h2>
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={data.categoryBreakdown}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {data.categoryBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => formatRupiah(val)}
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 flex-1">
              {data.categoryBreakdown.map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-sm text-slate-300">{c.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{formatRupiah(c.total)}</p>
                    <p className="text-xs text-slate-500">{((c.total / totalExpense) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {data.categoryBreakdown.length === 0 && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-10 text-center text-slate-500">
          Belum ada data pengeluaran bulan ini dengan kategori
        </div>
      )}
    </div>
  );
}
