"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [pin, setPin] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFirst, setIsFirst] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const newPin = [...pin];
    newPin[i] = val;
    setPin(newPin);
    if (val && i < 5) inputs.current[i + 1]?.focus();
    if (newPin.every((d) => d !== "")) {
      submit(newPin.join(""));
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const submit = async (pinStr: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinStr }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "PIN salah");
        setPin(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
      } else {
        if (data.firstTime) setIsFirst(true);
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPin = async () => {
    if (!confirm("Reset PIN dan buat PIN baru?")) return;
    setLoading(true);
    await fetch("/api/auth/login", { method: "PUT" });
    setPin(["", "", "", "", "", ""]);
    setError("");
    setIsFirst(true);
    setLoading(false);
    alert("PIN berhasil di-reset. Silakan masukkan 6 digit PIN baru!");
    inputs.current[0]?.focus();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4 text-3xl">
            💰
          </div>
          <h1 className="text-2xl font-bold text-white">Finansialku</h1>
          <p className="text-slate-400 text-sm mt-1">
            {isFirst ? "Buat PIN baru kamu" : "Masukkan PIN kamu"}
          </p>
        </div>

        {/* PIN inputs */}
        <div className="flex gap-3 justify-center mb-6">
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-slate-900 text-white outline-none transition-all
                ${digit ? "border-indigo-500" : "border-slate-700"}
                focus:border-indigo-400`}
            />
          ))}
        </div>

        {error && (
          <div className="text-center mb-4 space-y-2">
            <p className="text-red-400 text-sm animate-pulse">{error}</p>
            <button
              type="button"
              onClick={handleResetPin}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline"
            >
              Lupa PIN? Klik untuk reset PIN baru
            </button>
          </div>
        )}

        {loading && (
          <div className="flex justify-center">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <p className="text-slate-500 text-xs text-center mt-8">
          Data tersimpan di device-mu sendiri 🔒
        </p>
      </div>
    </div>
  );
}
