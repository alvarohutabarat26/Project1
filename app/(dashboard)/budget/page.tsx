"use client";
import { useEffect, useState } from "react";
import { formatRupiah, getCurrentMonth, getMonthLabel } from "@/lib/utils";
import { Plus, X } from "lucide-react";

interface Budget {
  id: string;
  limitAmount: number;
  spentAmount: number;
  month: string;
  category: { id: string; name: string; color: string };
}

interface Category {
  id: string;
  name: string;
  color: string;
}

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [month, setMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [bRes, cRes] = await Promise.all([
      fetch(`/api/budgets?month=${month}`),
      fetch("/api/categories"),
    ]);
    setBudgets(await bRes.json());
    setCategories(await cRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [month]);

  const totalBudget = budgets.reduce((s, b) => s + b.limitAmount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spentAmount, 0);

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">💼 Budget</h1>
          <p className="text-slate-400 text-sm">{getMonthLabel(month)}</p>
        </div>
        <div className="flex gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Summary */}
      {budgets.length > 0 && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-slate-400 text-xs">Total Terpakai</p>
              <p className="text-white font-bold text-xl">{formatRupiah(totalSpent)}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs">Total Budget</p>
              <p className="text-white font-bold text-xl">{formatRupiah(totalBudget)}</p>
            </div>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                totalSpent / totalBudget >= 1 ? "bg-red-500" :
                totalSpent / totalBudget >= 0.8 ? "bg-yellow-500" : "bg-indigo-500"
              }`}
              style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1 text-right">
            {((totalSpent / totalBudget) * 100).toFixed(1)}% terpakai
          </p>
        </div>
      )}

      {/* Budget list */}
      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="space-y-3">
        {budgets.map((b) => {
          const pct = b.limitAmount > 0 ? (b.spentAmount / b.limitAmount) * 100 : 0;
          const over = pct >= 100;
          const warning = pct >= 80 && !over;

          return (
            <div key={b.id} className="bg-slate-900 rounded-xl border border-slate-800 p-4">
              <div className="flex justify-between items-center mb-2">
                <span
                  className="text-sm font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: b.category.color + "30", color: b.category.color }}
                >
                  {b.category.name}
                </span>
                <div className="text-right">
                  {over && <span className="text-xs text-red-400 font-medium">Over budget!</span>}
                  {warning && <span className="text-xs text-yellow-400 font-medium">Hampir habis</span>}
                </div>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white font-semibold">{formatRupiah(b.spentAmount)}</span>
                <span className="text-slate-400">dari {formatRupiah(b.limitAmount)}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    backgroundColor: over ? "#f43f5e" : warning ? "#f59e0b" : b.category.color,
                  }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1 text-right">{pct.toFixed(1)}%</p>
            </div>
          );
        })}
      </div>

      {!loading && budgets.length === 0 && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center">
          <p className="text-4xl mb-3">💼</p>
          <p className="text-slate-300 font-medium">Belum ada budget bulan ini</p>
          <p className="text-slate-500 text-sm mt-1">Set limit pengeluaran per kategori</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-4 bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700"
          >
            Buat Budget
          </button>
        </div>
      )}

      {showAdd && (
        <AddBudgetModal
          categories={categories}
          month={month}
          onClose={() => setShowAdd(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}

function AddBudgetModal({ categories, month, onClose, onSuccess }: {
  categories: Category[];
  month: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({ categoryId: "", limitAmount: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, month, limitAmount: parseFloat(form.limitAmount) }),
    });
    setLoading(false);
    onClose();
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-white">Buat Budget</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Kategori</label>
            <select
              required
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-indigo-500"
            >
              <option value="">Pilih kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Limit Budget (Rp)</label>
            <input
              required
              type="number"
              placeholder="500000"
              value={form.limitAmount}
              onChange={(e) => setForm({ ...form, limitAmount: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            {loading ? "Menyimpan..." : "Buat Budget"}
          </button>
        </form>
      </div>
    </div>
  );
}
