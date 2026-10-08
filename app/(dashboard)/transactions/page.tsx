"use client";
import { useEffect, useState } from "react";
import { formatRupiah, formatDatetime, getCurrentMonth, getMonthLabel } from "@/lib/utils";
import { ArrowUpRight, ArrowDownLeft, Search, Filter, Plus, X } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  notes: string;
  createdAt: string;
  category?: { id: string; name: string; color: string } | null;
  account?: { name: string; bank: string } | null;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"" | "IN" | "OUT">("");
  const [filterMonth, setFilterMonth] = useState(getCurrentMonth());
  const [showAdd, setShowAdd] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams({ month: filterMonth, limit: "100" });
    if (filterType) params.set("type", filterType);
    const [txRes, catRes] = await Promise.all([
      fetch(`/api/transactions?${params}`),
      fetch("/api/categories"),
    ]);
    const txData = await txRes.json();
    const catData = await catRes.json();
    setTransactions(txData.transactions || []);
    setTotal(txData.total || 0);
    setCategories(catData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filterType, filterMonth]);

  const filtered = transactions.filter((tx) =>
    tx.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Transaksi</h1>
          <p className="text-slate-400 text-sm">{total} transaksi ditemukan</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Tambah
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari transaksi..."
            className="w-full pl-8 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as "" | "IN" | "OUT")}
          className="bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
        >
          <option value="">Semua</option>
          <option value="IN">Masuk</option>
          <option value="OUT">Keluar</option>
        </select>
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
        />
      </div>

      {/* List */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 divide-y divide-slate-800">
        {loading && (
          <div className="p-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="p-8 text-center text-slate-500">Tidak ada transaksi</div>
        )}
        {!loading && filtered.map((tx) => (
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
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-slate-500">{formatDatetime(tx.createdAt)}</p>
                {tx.account && <span className="text-xs text-slate-600">• {tx.account.bank}</span>}
              </div>
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

      {/* Add Transaction Modal */}
      {showAdd && (
        <AddTransactionModal
          categories={categories}
          onClose={() => setShowAdd(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}

function AddTransactionModal({
  categories,
  onClose,
  onSuccess,
}: {
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    type: "OUT" as "IN" | "OUT",
    amount: "",
    description: "",
    categoryId: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    setLoading(false);
    onClose();
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-white">Tambah Transaksi</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex rounded-xl overflow-hidden border border-slate-800">
            {(["OUT", "IN"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, type: t })}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  form.type === t
                    ? t === "IN" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t === "IN" ? "Masuk" : "Keluar"}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Jumlah (Rp)</label>
            <input
              required
              type="number"
              placeholder="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-lg font-bold outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Deskripsi</label>
            <input
              placeholder="Makan siang, Grab, dll."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Kategori</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-indigo-500"
            >
              <option value="">Tanpa kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      </div>
    </div>
  );
}
