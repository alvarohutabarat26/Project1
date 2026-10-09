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

export function detectBank(text: string, appHint?: string): string {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // 1. Cek langsung jika diawali nama bank/e-wallet (baik dengan spasi/titik dua maupun menempel seperti "DANARp...", "SeaBankKamu...")
  if (/^seabank/i.test(clean)) return "SeaBank";
  if (/^dana/i.test(clean)) return "DANA";
  if (/^(?:gopay|gojek)/i.test(clean)) return "GoPay";
  if (/^(?:shopeepay|shopee|spay)/i.test(clean)) return "ShopeePay";
  if (/^(?:wondr|bni)/i.test(clean)) return "wondr by BNI";
  if (/^(?:jago|bank\s*jago)/i.test(clean)) return "Bank Jago";
  if (/^(?:bale|btn)/i.test(clean)) return "bale by BTN";
  if (/^ovo/i.test(clean)) return "OVO";
  if (/^bca/i.test(clean)) return "BCA";
  if (/^(?:mandiri|livin)/i.test(clean)) return "Mandiri";
  if (/^(?:bri|brimo)/i.test(clean)) return "BRI";

  // 2. Cek appHint atau prefix dengan kurung/titik dua: "[SeaBank] ...", "DANA: ...", dll
  const prefixMatch = clean.match(/^\[?([a-zA-Z0-9\s]+?)\]?\s*[:\-–]\s*/);
  const prefix = (prefixMatch ? prefixMatch[1] : (appHint || "")).toLowerCase().trim();

  if (prefix) {
    if (prefix.includes("seabank") || prefix.includes("sea bank")) return "SeaBank";
    if (prefix.includes("wondr") || prefix.includes("bni")) return "wondr by BNI";
    if (prefix.includes("dana")) return "DANA";
    if (prefix.includes("gopay") || prefix.includes("gojek")) return "GoPay";
    if (prefix.includes("shopeepay") || prefix.includes("shopee") || prefix.includes("spay")) return "ShopeePay";
    if (prefix.includes("jago")) return "Bank Jago";
    if (prefix.includes("bale") || prefix.includes("btn")) return "bale by BTN";
    if (prefix.includes("ovo")) return "OVO";
    if (prefix.includes("bca")) return "BCA";
    if (prefix.includes("mandiri") || prefix.includes("livin")) return "Mandiri";
    if (prefix.includes("bri") || prefix.includes("brimo")) return "BRI";
  }

  const combined = `${appHint || ""} ${clean}`.toLowerCase();

  // 3. Cek keyword spesifik di dalam isi teks
  if (combined.includes("wondr") || combined.includes("bni") || combined.includes("1500 130") || combined.includes("1500130")) return "wondr by BNI";
  if (combined.includes("seabank") || combined.includes("sea bank") || combined.includes("pt bank seabank")) return "SeaBank";
  if (combined.includes("shopeepay") || combined.includes("spay")) return "ShopeePay";
  if (combined.includes("gopay") || combined.includes("gojek")) return "GoPay";
  if (combined.includes("bank jago") || combined.includes("pt bank jago") || /\bjago\b/.test(combined)) return "Bank Jago";
  if (combined.includes("bale") || combined.includes("btn") || combined.includes("bank btn")) return "bale by BTN";
  if (combined.includes("ovo") || combined.includes("ovo cash")) return "OVO";
  if (combined.includes("bca") || combined.includes("mybca") || combined.includes("bca mobile")) return "BCA";
  if (combined.includes("mandiri") || combined.includes("livin")) return "Mandiri";
  if (combined.includes("bri") || combined.includes("brimo")) return "BRI";

  // 4. Untuk e-wallet DANA: pastikan bukan kata umum bahasa Indonesia ("menerima dana", "sumber dana", dll)
  const isDanaWallet =
    /\b(saldo\s+dana|akun\s+dana|dana\s+id|aplikasi\s+dana|dana\s+kaget|dana\s+protection|kirim\s+dana\s+ke)\b/i.test(combined) ||
    (/\bdana\b/i.test(combined) &&
      !/(?:menerima|sumber|pengembalian|penarikan|transfer|pemindahan|alokasi|tarik)\s+dana/i.test(combined) &&
      !/dana\s+sebesar/i.test(combined));

  if (isDanaWallet) return "DANA";

  // Fallback Shopee jika ada kata shopee
  if (combined.includes("shopee")) return "ShopeePay";

  return "wondr by BNI"; // Default fallback
}

export function parseSmsBank(text: string, appHint?: string): ParsedTransaction | null {
  if (!text || text.trim().length === 0) return null;

  const bank = detectBank(text, appHint);
  const lower = text.toLowerCase();

  function parseAmount(str: string): number {
    return parseFloat(str.replace(/\./g, "").replace(",", ".")) || 0;
  }

  // 1. Ekstrak nominal: cocokkan format Rp62.000, Rp. 62.000, IDR 62.000, ataupun 62.000
  const amountPatterns = [
    /(?:rp\.?|idr)\s*([\d.,]+)/i,
    /sebesar\s*(?:rp\.?)?\s*([\d.,]+)/i,
    /senilai\s*(?:rp\.?)?\s*([\d.,]+)/i,
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
  // Indikator pasti uang keluar:
  const isDefiniteExpense =
    /(?:melakukan\s+top\s*up|top\s*up.*ke\b|transfer.*ke\b|transfer.*kepada\b|kirim.*ke\b|dikirim.*ke\b|berhasil\s+transfer|transfer\s+berhasil|bayar|pembayaran|qris|tarik|penarikan|pembelian|debit|debet|\bdb\b)/i.test(lower);

  // Indikator pasti uang masuk:
  const isDefiniteIncome =
    /(?:pengisian\s+saldo|isi\s+saldo|telah\s+ditambahkan|berhasil\s+ditambahkan|ditambahkan\s+ke|menerima\s+dana|kamu\s+menerima|menerima\s+transfer|diterima\s+dari|uang\s+masuk|dana\s+masuk|saldo\s+masuk|transfer\s+masuk|setor\s+tunai|setoran|top\s*up\s+saldo.*dari|berhasil\s+top\s*up|top\s*up\s+berhasil|kredit|\bcr\b|cashback|pengembalian\s+dana|refund)/i.test(lower);

  let type: "IN" | "OUT" = "OUT";

  if (isDefiniteIncome && !isDefiniteExpense) {
    type = "IN";
  } else if (isDefiniteExpense && !isDefiniteIncome) {
    type = "OUT";
  } else if (isDefiniteIncome && isDefiniteExpense) {
    // Jika ada dua-duanya: periksa apakah teks berorientasi menerima
    if (/menerima|diterima|telah\s+ditambahkan|ditambahkan|pengisian|masuk/i.test(lower)) {
      type = "IN";
    } else {
      type = "OUT";
    }
  } else {
    // Fallback kata kunci sederhana
    const hasIncome = ["terima", "masuk", "kredit", "cr", "cashback"].some((k) => lower.includes(k));
    const hasExpense = ["kirim", "keluar", "bayar", "debit", "db", "beli", "tarik"].some((k) => lower.includes(k));
    if (hasIncome && !hasExpense) type = "IN";
    else if (hasExpense && !hasIncome) type = "OUT";
    else type = lower.includes("dari") ? "IN" : "OUT";
  }

  // Rapikan deskripsi jika ada nama bank/e-wallet menempel di awal
  let cleanDesc = text.trim();
  const bankPrefixRegex = new RegExp(`^${bank}\\s*[:\\-–]?\\s*`, "i");
  if (bankPrefixRegex.test(cleanDesc)) {
    const rest = cleanDesc.replace(bankPrefixRegex, "").trim();
    cleanDesc = `${bank}: ${rest}`;
  }

  return {
    type,
    amount: detectedAmount,
    description: cleanDesc.slice(0, 150),
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
