// Bo dem thoi gian tap luyen — chi tinh toan/dinh dang o client, khong goi
// API. Luu tong so phut vao bang session_logs khi khach hoan thanh buoi.

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function minutesBetween(startMs: number, endMs: number): number {
  return Math.max(1, Math.round((endMs - startMs) / 60000));
}
