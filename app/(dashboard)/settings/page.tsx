"use client";
import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/utils";
import { LogOut, Plus, X, Copy, Check, Trash2 } from "lucide-react";

interface Account {
  id: string;
  name: string;
  bank: string;
  balance: number;
  color: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  keywords: string;
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#06b6d4", "#ec4899", "#94a3b8"];

const DEFAULT_CATEGORIES = [
  { name: "Makan & Minum", color: "#f59e0b", keywords: "makan,minum,resto,warung,kafe,coffee,bakso,soto,nasi" },
  { name: "Transport", color: "#06b6d4", keywords: "grab,gojek,ojek,bensin,spbu,parkir,tol,busway,commuter" },
  { name: "Belanja", color: "#ec4899", keywords: "shopee,tokopedia,lazada,indomaret,alfamart,hypermart,belanja" },
  { name: "Tagihan", color: "#f43f5e", keywords: "listrik,pln,air,pdam,wifi,internet,telkom,indihome,tagihan" },
  { name: "Hiburan", color: "#8b5cf6", keywords: "netflix,spotify,cinema,bioskop,steam,game,hiburan" },
  { name: "Kesehatan", color: "#10b981", keywords: "apotek,klinik,rumah sakit,dokter,obat,vitamin,gym" },
  { name: "Pendidikan", color: "#6366f1", keywords: "buku,kursus,sekolah,kampus,kuliah,pendidikan" },
];

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [seedingCats, setSeedingCats] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleResetData = async () => {
    if (!confirm("Yakin ingin menghapus semua data transaksi & mengosongkan saldo? Tindakan ini tidak dapat dibatalkan.")) return;
    setResetting(true);
    try {
      const res = await fetch("/api/reset-data", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        alert(json.message || "Data berhasil dibersihkan!");
        refreshData();
      } else {
        alert("Gagal membersihkan data");
      }
    } catch {
      alert("Terjadi kesalahan koneksi");
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWebhookUrl(`${window.location.origin}/api/webhook`);
    }
    fetch("/api/accounts").then((r) => r.json()).then(setAccounts);
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  const copyWebhook = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const seedCategories = async () => {
    setSeedingCats(true);
    for (const cat of DEFAULT_CATEGORIES) {
      await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cat),
      });
    }
    const res = await fetch("/api/categories");
    setCategories(await res.json());
    setSeedingCats(false);
  };

  const logout = async () => {
    await fetch("/api/auth/login", { method: "DELETE" });
    window.location.href = "/login";
  };

  const refreshData = () => {
    fetch("/api/accounts").then((r) => r.json()).then(setAccounts);
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Pengaturan</h1>
        <p className="text-slate-400 text-sm">Kelola akun, kategori & webhook</p>
      </div>

      {/* Webhook */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
        <h2 className="font-semibold text-white mb-1">🔗 Webhook URL</h2>
        <p className="text-slate-400 text-sm mb-4">
          Gunakan URL ini di Tasker/MacroDroid untuk forward notifikasi HP ke app kamu.
        </p>
        <div className="flex gap-2">
          <div className="flex-1 bg-slate-800 rounded-xl px-4 py-2.5 text-slate-300 text-sm font-mono truncate">
            {webhookUrl || "Loading..."}
          </div>
          <button
            onClick={copyWebhook}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm transition-colors"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <div className="mt-4 bg-slate-800/50 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-semibold mb-2">Cara setup di MacroDroid:</p>
          <ol className="text-xs text-slate-500 space-y-1 list-decimal list-inside">
            <li>Buka MacroDroid → Buat Macro baru</li>
            <li>Trigger: "SMS Received" atau "Notification Received"</li>
            <li>Action: "HTTP Request" → Method: POST</li>
            <li>URL: isi dengan Webhook URL di atas</li>
            <li>Header: <code className="bg-slate-700 px-1 rounded">Authorization: Bearer [WEBHOOK_SECRET]</code></li>
            <li>Body JSON: <code className="bg-slate-700 px-1 rounded">{`{"text": "[sms_body]"}`}</code></li>
          </ol>
        </div>
      </div>

      {/* Rekening */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-white">🏦 Rekening</h2>
          <button
            onClick={() => setShowAddAccount(true)}
            className="text-indigo-400 text-sm flex items-center gap-1 hover:text-indigo-300"
          >
            <Plus size={14} /> Tambah
          </button>
        </div>
        {accounts.length === 0 && (
          <p className="text-slate-500 text-sm">Belum ada rekening. Tambahkan rekening bankmu.</p>
        )}
        <div className="space-y-2">
          {accounts.map((acc) => (
            <div key={acc.id} className="flex items-center gap-3 bg-slate-800 rounded-xl p-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: acc.color + "40", color: acc.color }}>
                {acc.bank.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{acc.name}</p>
                <p className="text-slate-400 text-xs">{acc.bank}</p>
              </div>
              <p className="text-white font-semibold text-sm">{formatRupiah(acc.balance)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Kategori */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-white">🏷️ Kategori</h2>
          <div className="flex gap-2">
            {categories.length === 0 && (
              <button
                onClick={seedCategories}
                disabled={seedingCats}
                className="text-emerald-400 text-xs hover:text-emerald-300 disabled:opacity-50"
              >
                {seedingCats ? "Memuat..." : "Isi default"}
              </button>
            )}
            <button
              onClick={() => setShowAddCategory(true)}
              className="text-indigo-400 text-sm flex items-center gap-1 hover:text-indigo-300"
            >
              <Plus size={14} /> Tambah
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span
              key={cat.id}
              className="text-xs px-3 py-1.5 rounded-full font-medium"
              style={{ backgroundColor: cat.color + "30", color: cat.color }}
            >
              {cat.name}
            </span>
          ))}
          {categories.length === 0 && (
            <p className="text-slate-500 text-sm">Belum ada kategori. Klik "Isi default" untuk menambahkan kategori umum.</p>
          )}
        </div>
      </div>

      {/* Danger Zone: Reset Data */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 sm:p-5">
        <h2 className="font-semibold text-red-400 text-sm mb-1 flex items-center gap-2">
          <Trash2 size={16} /> Zona Bahaya
        </h2>
        <p className="text-slate-400 text-xs mb-3">
          Hapus seluruh riwayat transaksi, setoran, dan reset saldo semua akun ke Rp 0 untuk pengujian baru. PIN Anda tetap aman.
        </p>
        <button
          onClick={handleResetData}
          disabled={resetting}
          className="bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2"
        >
          <Trash2 size={14} />
          {resetting ? "Membersihkan..." : "Bersihkan Semua Data Transaksi (Reset ke Rp 0)"}
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
      >
        <LogOut size={16} /> Keluar
      </button>

      {showAddAccount && (
        <AddAccountModal onClose={() => setShowAddAccount(false)} onSuccess={refreshData} colors={COLORS} />
      )}
      {showAddCategory && (
        <AddCategoryModal onClose={() => setShowAddCategory(false)} onSuccess={refreshData} colors={COLORS} />
      )}
    </div>
  );
}

function AddAccountModal({ onClose, onSuccess, colors }: { onClose: () => void; onSuccess: () => void; colors: string[] }) {
  const [form, setForm] = useState({ name: "", bank: "", balance: "", color: colors[0] });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, balance: parseFloat(form.balance) }),
    });
    setLoading(false);
    onClose();
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-white">Tambah Rekening</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Nama (misal: Rekening Utama)</label>
            <input required placeholder="Rekening Utama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Bank</label>
            <input required placeholder="BNI, BCA, Mandiri, GoPay..." value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Saldo Awal (Rp)</label>
            <input required type="number" placeholder="0" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Warna</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? "border-white scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors">
            {loading ? "Menyimpan..." : "Tambah Rekening"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AddCategoryModal({ onClose, onSuccess, colors }: { onClose: () => void; onSuccess: () => void; colors: string[] }) {
  const [form, setForm] = useState({ name: "", color: colors[0], keywords: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    onClose();
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-white">Tambah Kategori</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Nama Kategori</label>
            <input required placeholder="Makan, Transport, dll." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              Kata Kunci Auto-Kategori <span className="text-slate-600">(pisahkan dengan koma)</span>
            </label>
            <input placeholder="grab,gojek,ojek,bensin" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Warna</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? "border-white scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors">
            {loading ? "Menyimpan..." : "Tambah Kategori"}
          </button>
        </form>
      </div>
    </div>
  );
}
