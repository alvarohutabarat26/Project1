// Parser untuk SMS dan Notifikasi Bank / E-Wallet Indonesia
export interface ParsedTransaction {
  type: "IN" | "OUT";
  amount: number;
  description: string;
  bank: string;
}

export const BANK_CONFIGS: Record<string, { color: string; label: string; icon: string; short: string }> = {
  "wondr by BNI": { color: "#f97316", label: "wondr by BNI", icon: "🟠", short: "BNI" },
  "DANA": { color: "#0284c7", label: "DANA", icon: "💙", short: "DANA" },
  "GoPay": { color: "#00aec6", label: "GoPay", icon: "🟢", short: "GoPay" },
  "SeaBank": { color: "#ea580c", label: "SeaBank", icon: "🟠", short: "SeaBank" },
  "Bank Jago": { color: "#f59e0b", label: "Bank Jago", icon: "💛", short: "Jago" },
  "ShopeePay": { color: "#ee4d2d", label: "ShopeePay", icon: "🛍️", short: "SPay" },
  "bale by BTN": { color: "#2563eb", label: "bale by BTN", icon: "🏢", short: "BTN" },
  "OVO": { color: "#7c3aed", label: "OVO", icon: "💜", short: "OVO" },
  "BCA": { color: "#00529c", label: "BCA", icon: "💳", short: "BCA" },
  "Mandiri": { color: "#0369a1", label: "Mandiri", icon: "🏦", short: "Mandiri" },
  "BRI": { color: "#1d4ed8", label: "BRI", icon: "🏦", short: "BRI" },
};

export function detectBank(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("wondr") || lower.includes("bni")) return "wondr by BNI";
  if (lower.includes("dana")) return "DANA";
  if (lower.includes("gopay") || lower.includes("gojek")) return "GoPay";
  if (lower.includes("seabank") || lower.includes("sea bank")) return "SeaBank";
  if (lower.includes("jago") || lower.includes("bank jago")) return "Bank Jago";
  if (lower.includes("shopeepay") || lower.includes("shopee") || lower.includes("spay")) return "ShopeePay";
  if (lower.includes("bale") || lower.includes("btn")) return "bale by BTN";
  if (lower.includes("ovo")) return "OVO";
  if (lower.includes("bca")) return "BCA";
  if (lower.includes("mandiri") || lower.includes("livin")) return "Mandiri";
  if (lower.includes("bri") || lower.includes("brimo")) return "BRI";
  return "wondr by BNI"; // Default fallback
}

export function parseSmsBank(text: string): ParsedTransaction | null {
  const bank = detectBank(text);

  function parseAmount(str: string): number {
    return parseFloat(str.replace(/\./g, "").replace(",", ".")) || 0;
  }

  // Regex deteksi tipe & amount
  const inRegex = /(?:trfmasuk|transfer masuk|dana masuk|kredit|cr|top.?up|diterima|terima|masuk|uang masuk)[^\d]*rp\.?\s*([\d.,]+)/i;
  const outRegex = /(?:trfkeluar|transfer keluar|debit|db|bayar|pembayaran|qris|kirim|keluar|uang keluar)[^\d]*rp\.?\s*([\d.,]+)/i;
  const genericAmount = /rp\.?\s*([\d.,]+)/i;

  const inMatch = text.match(inRegex);
  const outMatch = text.match(outRegex);
  const amtMatch = text.match(genericAmount);

  if (inMatch) {
    return {
      type: "IN",
      amount: parseAmount(inMatch[1]),
      description: text.slice(0, 120),
      bank,
    };
  }

  if (outMatch) {
    return {
      type: "OUT",
      amount: parseAmount(outMatch[1]),
      description: text.slice(0, 120),
      bank,
    };
  }

  if (amtMatch) {
    // Cek ada kata penerima / pengirim
    const lower = text.toLowerCase();
    const isIncome = lower.includes("dari") || lower.includes("diterima") || lower.includes("masuk");
    return {
      type: isIncome ? "IN" : "OUT",
      amount: parseAmount(amtMatch[1]),
      description: text.slice(0, 120),
      bank,
    };
  }

  return null;
}

export function autoCategory(
  description: string,
  categories: { id: string; name: string; keywords: string }[]
): string | null {
  const lower = description.toLowerCase();
  for (const cat of categories) {
    const keywords = cat.keywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
    if (keywords.some((kw) => lower.includes(kw))) {
      return cat.id;
    }
  }
  return null;
}
