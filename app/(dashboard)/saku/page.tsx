"use client";
import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/utils";
import { Plus, X, Wallet } from "lucide-react";

interface Saku {
  id: string;
  name: string;
  allocatedAmount: number;
  spentAmount: number;
  color: string;
  icon: string;
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#06b6d4", "#ec4899"];

export default function SakuPage() {
  const [sakuList, setSakuList] = useState<Saku[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showSetoran, setShowSetoran] = useState<Saku | null>(null);

  const fetchData = async () => {
    const res = await fetch("/api/saku");
    setSakuList(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const totalAllocated = sakuList.reduce((s, k) => s + k.allocatedAmount, 0);
  const totalSisa = sakuList.reduce((s, k) => s + (k.allocatedAmount - k.spentAmount), 0);

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wallet size={24} className="text-indigo-400" /> Saku
          </h1>
          <p className="text-slate-400 text-sm">Kelola alokasi danamu</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Buat Saku
        </button>
      </div>

      {/* Summary */}
      {sakuList.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <p className="text-slate-400 text-xs mb-1">Total Dialokasikan</p>
            <p className="text-white font-bold text-lg">{formatRupiah(totalAllocated)}</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <p className="text-slate-400 text-xs mb-1">Total Sisa</p>
            <p className="text-emerald-400 font-bold text-lg">{formatRupiah(totalSisa)}</p>
          </div>
        </div>
      )}

      {/* Saku Cards */}
      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sakuList.map((s) => {
          const sisa = s.allocatedAmount - s.spentAmount;
          const pct = s.allocatedAmount > 0 ? (s.spentAmount / s.allocatedAmount) * 100 : 0;
          return (
            <div key={s.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: s.color + "30" }}>
                  👜
                </div>
                <div>
                  <p className="text-white font-semibold">{s.name}</p>
                  <p className="text-slate-500 text-xs">dari {formatRupiah(s.allocatedAmount)}</p>
                </div>
              </div>
              <p className="text-2xl font-bold mb-1" style={{ color: s.color }}>{formatRupiah(sisa)}</p>
              <p className="text-slate-500 text-xs mb-3">sisa · {formatRupiah(s.spentAmount)} terpakai</p>

              {/* Progress bar */}
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    backgroundColor: pct >= 100 ? "#f43f5e" : pct >= 80 ? "#f59e0b" : s.color,
                  }}
                />
              </div>
              <p className="text-xs text-right text-slate-500">{Math.round(pct)}% terpakai</p>
            </div>
          );
        })}
      </div>

      {!loading && sakuList.length === 0 && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center">
          <p className="text-4xl mb-3">👜</p>
          <p className="text-slate-300 font-medium">Belum ada saku</p>
          <p className="text-slate-500 text-sm mt-1">Buat saku untuk mengalokasikan danamu</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-4 bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700"
          >
            Buat Saku Pertama
          </button>
        </div>
      )}

      {showAdd && (
        <AddSakuModal
          onClose={() => setShowAdd(false)}
          onSuccess={fetchData}
          colors={COLORS}
        />
      )}
    </div>
  );
}

function AddSakuModal({ onClose, onSuccess, colors }: { onClose: () => void; onSuccess: () => void; colors: string[] }) {
  const [form, setForm] = useState({ name: "", allocatedAmount: "", color: colors[0] });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/saku", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, allocatedAmount: parseFloat(form.allocatedAmount) }),
    });
    setLoading(false);
    onClose();
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-white">Buat Saku Baru</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Nama Saku</label>
            <input
              required
              placeholder="Jajan, Kos, Transport..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Dana Dialokasikan (Rp)</label>
            <input
              required
              type="number"
              placeholder="500000"
              value={form.allocatedAmount}
              onChange={(e) => setForm({ ...form, allocatedAmount: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Warna</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? "border-white scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            {loading ? "Menyimpan..." : "Buat Saku"}
          </button>
        </form>
      </div>
    </div>
  );
}
