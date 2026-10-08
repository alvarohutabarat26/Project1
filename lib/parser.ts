// Parser untuk SMS notifikasi bank Indonesia
export interface ParsedTransaction {
  type: "IN" | "OUT";
  amount: number;
  description: string;
  bank?: string;
}

export function parseSmsBank(text: string): ParsedTransaction | null {
  const normalized = text.toLowerCase();

  // Patterns untuk berbagai bank Indonesia
  const patterns = [
    // BNI
    {
      bank: "BNI",
      inPattern: /(?:trfmasuk|transfer masuk|dana masuk|kredit)[^\d]*rp\.?\s*([\d.,]+)/i,
      outPattern: /(?:trfkeluar|transfer keluar|debit|pembayaran)[^\d]*rp\.?\s*([\d.,]+)/i,
    },
    // BCA
    {
      bank: "BCA",
      inPattern: /(?:cr|kredit|masuk)[^\d]*rp\.?\s*([\d.,]+)/i,
      outPattern: /(?:db|debit|keluar|transfer ke)[^\d]*rp\.?\s*([\d.,]+)/i,
    },
    // Mandiri
    {
      bank: "Mandiri",
      inPattern: /(?:masuk|kredit|cr)[^\d]*rp\.?\s*([\d.,]+)/i,
      outPattern: /(?:keluar|debit|db|transfer)[^\d]*rp\.?\s*([\d.,]+)/i,
    },
    // BRI
    {
      bank: "BRI",
      inPattern: /(?:terima|masuk|kredit)[^\d]*rp\.?\s*([\d.,]+)/i,
      outPattern: /(?:kirim|keluar|debit|bayar)[^\d]*rp\.?\s*([\d.,]+)/i,
    },
    // GoPay / OVO / Dana / ShopeePay
    {
      bank: "E-Wallet",
      inPattern: /(?:top.?up|terima|masuk|diterima)[^\d]*rp\.?\s*([\d.,]+)/i,
      outPattern: /(?:bayar|kirim|transfer|keluar)[^\d]*rp\.?\s*([\d.,]+)/i,
    },
  ];

  // Generic pattern sebagai fallback
  const genericIn = /(?:masuk|kredit|cr|diterima|terima|top.?up)[^\d]*rp\.?\s*([\d.,]+)/i;
  const genericOut = /(?:keluar|debit|db|bayar|transfer|kirim)[^\d]*rp\.?\s*([\d.,]+)/i;
  const amountOnly = /rp\.?\s*([\d.,]+)/i;

  function parseAmount(str: string): number {
    return parseFloat(str.replace(/\./g, "").replace(",", ".")) || 0;
  }

  // Coba tiap pattern bank
  for (const { bank, inPattern, outPattern } of patterns) {
    const inMatch = text.match(inPattern);
    const outMatch = text.match(outPattern);

    if (inMatch) {
      return {
        type: "IN",
        amount: parseAmount(inMatch[1]),
        description: text.slice(0, 100),
        bank,
      };
    }
    if (outMatch) {
      return {
        type: "OUT",
        amount: parseAmount(outMatch[1]),
        description: text.slice(0, 100),
        bank,
      };
    }
  }

  // Generic fallback
  const inMatch = text.match(genericIn);
  const outMatch = text.match(genericOut);
  const amountMatch = text.match(amountOnly);

  if (inMatch) {
    return { type: "IN", amount: parseAmount(inMatch[1]), description: text.slice(0, 100) };
  }
  if (outMatch) {
    return { type: "OUT", amount: parseAmount(outMatch[1]), description: text.slice(0, 100) };
  }
  if (amountMatch) {
    // Kalau ada amount tapi tidak jelas IN/OUT, asumsikan OUT
    return { type: "OUT", amount: parseAmount(amountMatch[1]), description: text.slice(0, 100) };
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
