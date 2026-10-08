"use client";
import { useEffect, useState } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Plus, X, Target } from "lucide-react";

interface Tabungan {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  color: string;
  setoran?: { id: string; amount: number; createdAt: string }[];
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#06b6d4", "#ec4899"];

export default function TabunganPage() {
  const [list, setList] = useState<Tabungan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showSetoran, setShowSetoran] = useState<Tabungan | null>(null);

  const fetchData = async () => {
    const res = await fetch("/api/tabungan");
    setList(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">🐷 Tabungan</h1>
          <p className="text-slate-400 text-sm">Target & progress menabungmu</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Buat Target
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="space-y-4">
        {list.map((t) => {
          const pct = Math.min((t.currentAmount / t.targetAmount) * 100, 100);
          const sisa = t.targetAmount - t.currentAmount;
          const done = t.currentAmount >= t.targetAmount;

          return (
            <div key={t.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-white font-semibold text-lg">{t.name}</h3>
                  {t.deadline && (
                    <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                      <Target size={11} /> Target: {formatDate(t.deadline)}
                    </p>
                  )}
                </div>
                {done && (
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full font-medium">
                    ✅ Tercapai!
                  </span>
                )}
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-white font-bold">{formatRupiah(t.currentAmount)}</span>
                  <span className="text-slate-400">{formatRupiah(t.targetAmount)}</span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: t.color }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-slate-500">{pct.toFixed(1)}% tercapai</span>
                  {!done && <span className="text-xs text-slate-500">Kurang {formatRupiah(sisa)}</span>}
                </div>
              </div>

              {/* Recent setoran */}
              {t.setoran && t.setoran.length > 0 && (
                <div className="border-t border-slate-800 pt-3 mt-3">
                  <p className="text-xs text-slate-500 mb-2">Setoran terakhir</p>
                  {t.setoran.slice(0, 3).map((s) => (
                    <div key={s.id} className="flex justify-between text-xs text-slate-400 py-0.5">
                      <span>{formatDate(s.createdAt)}</span>
                      <span className="text-emerald-400">+{formatRupiah(s.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowSetoran(t)}
                disabled={done}
                className="mt-4 w-full border border-slate-700 hover:border-indigo-500 hover:text-indigo-400 text-slate-400 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
              >
                + Tambah Setoran
              </button>
            </div>
          );
        })}
      </div>

      {!loading && list.length === 0 && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center">
          <p className="text-4xl mb-3">🐷</p>
          <p className="text-slate-300 font-medium">Belum ada target tabungan</p>
          <p className="text-slate-500 text-sm mt-1">Buat target untuk mulai menabung!</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-4 bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700"
          >
            Buat Target Pertama
          </button>
        </div>
      )}

      {showAdd && (
        <AddTabunganModal
          onClose={() => setShowAdd(false)}
          onSuccess={fetchData}
          colors={COLORS}
        />
      )}
      {showSetoran && (
        <SetoranModal
          tabungan={showSetoran}
          onClose={() => setShowSetoran(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}

function AddTabunganModal({ onClose, onSuccess, colors }: { onClose: () => void; onSuccess: () => void; colors: string[] }) {
  const [form, setForm] = useState({ name: "", targetAmount: "", deadline: "", color: colors[0] });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/tabungan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, targetAmount: parseFloat(form.targetAmount) }),
    });
    setLoading(false);
    onClose();
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-white">Buat Target Tabungan</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Nama Target</label>
            <input
              required
              placeholder="Beli Laptop, Liburan, Dana Darurat..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Target Nominal (Rp)</label>
            <input
              required
              type="number"
              placeholder="5000000"
              value={form.targetAmount}
              onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Deadline (opsional)</label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-indigo-500"
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
            {loading ? "Menyimpan..." : "Buat Target"}
          </button>
        </form>
      </div>
    </div>
  );
}

function SetoranModal({ tabungan, onClose, onSuccess }: { tabungan: Tabungan; onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/tabungan/${tabungan.id}/setoran`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseFloat(amount), notes }),
    });
    setLoading(false);
    onClose();
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-white">Setoran ke "{tabungan.name}"</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Jumlah (Rp)</label>
            <input
              required
              type="number"
              placeholder="100000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-xl font-bold outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Catatan (opsional)</label>
            <input
              placeholder="Dari gaji, bonus, dll."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            {loading ? "Menyimpan..." : "Tambah Setoran"}
          </button>
        </form>
      </div>
    </div>
  );
}
