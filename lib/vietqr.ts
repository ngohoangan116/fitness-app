// Builds a VietQR dynamic QR image URL (no gateway/account required —
// this is a free public image-rendering API from vietqr.io).
// Bank BIN list: https://api.vietqr.io/v2/banks
export function buildVietQrUrl(params: {
  bankBin: string;      // e.g. "970436" for Vietcombank
  accountNo: string;    // your bank account number
  accountName: string;  // account holder name, unaccented, e.g. "NGUYEN VAN A"
  amount: number;       // VND, integer
  addInfo: string;      // transfer content — MUST include the order code
  template?: "compact2" | "compact" | "qr_only" | "print";
}) {
  const {
    bankBin,
    accountNo,
    accountName,
    amount,
    addInfo,
    template = "compact2",
  } = params;

  const query = new URLSearchParams({
    amount: String(Math.round(amount)),
    addInfo,
    accountName,
  });

  return `https://img.vietqr.io/image/${bankBin}-${accountNo}-${template}.png?${query.toString()}`;
}

export function generateOrderCode() {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `DH${Date.now().toString().slice(-6)}${rand}`;
}
