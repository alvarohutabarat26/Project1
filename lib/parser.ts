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
  if (lower.includes("seabank") || lower.includes("sea bank") || lower.includes("shopee bank")) return "SeaBank";
  if (lower.includes("dana")) return "DANA";
  if (lower.includes("gopay") || lower.includes("gojek")) return "GoPay";
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
  if (!text || text.trim().length === 0) return null;

  const bank = detectBank(text);
  const lower = text.toLowerCase();

  function parseAmount(str: string): number {
    return parseFloat(str.replace(/\./g, "").replace(",", ".")) || 0;
  }

  // 1. Ekstrak nominal: cocokkan format Rp62.000, Rp. 62.000, IDR 62.000, ataupun 62.000
  const amountPatterns = [
    /(?:rp\.?|idr)\s*([\d.,]+)/i,
    /sebesar\s*(?:rp\.?)?\s*([\d.,]+)/i,
    /([\d]{1,3}(?:\.[\d]{3})+(?:,[\d]+)?)/, // Angka ribuan dengan titik (contoh: 62.000)
    /([\d]{4,})/, // Angka polos >= 1000
  ];

  let detectedAmount = 0;
  for (const pat of amountPatterns) {
    const match = text.match(pat);
    if (match) {
      const val = parseAmount(match[1]);
      if (val >= 100) {
        detectedAmount = val;
        break;
      }
    }
  }

  if (detectedAmount <= 0) {
    return null;
  }

  // 2. Tentukan apakah uang masuk (IN) atau uang keluar (OUT)
  const isIncomeKeywords = [
    "terima",
    "diterima",
    "masuk",
    "top up",
    "topup",
    "kredit",
    "cr",
    "cashback",
    "penerimaan",
  ];

  const isExpenseKeywords = [
    "kirim",
    "dikirim",
    "keluar",
    "debit",
    "db",
    "bayar",
    "pembayaran",
    "qris",
    "transfer ke",
    "berhasil transfer",
    "tarik",
  ];

  let type: "IN" | "OUT" = "OUT";

  const hasIncome = isIncomeKeywords.some((kw) => lower.includes(kw));
  const hasExpense = isExpenseKeywords.some((kw) => lower.includes(kw));

  if (hasIncome && !hasExpense) {
    type = "IN";
  } else if (hasExpense && !hasIncome) {
    type = "OUT";
  } else if (hasIncome && hasExpense) {
    // Kalau ada dua-duanya (misal: "Top up saldo Rp... dari BNI" atau "Kamu menerima dana ... dari DANA"):
    // Jika ada kata "menerima" atau "top up berhasil" -> IN
    if (lower.includes("menerima") || lower.includes("top up") || lower.includes("masuk ke")) {
      type = "IN";
    } else {
      type = "OUT";
    }
  } else {
    // Fallback jika tidak ada kata kunci jelas
    type = lower.includes("dari") ? "IN" : "OUT";
  }

  return {
    type,
    amount: detectedAmount,
    description: text.slice(0, 150),
    bank,
  };
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
