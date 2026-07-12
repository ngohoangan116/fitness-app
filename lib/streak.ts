// Tinh streak (so ngay lien tuc co it nhat 1 bai tap hoan thanh), dua tren
// cac moc completed_at da co san trong user_progress — khong can them cot
// database nao.

function toDateKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function calcStreak(completedAtList: string[]): number {
  if (completedAtList.length === 0) return 0;

  const dateKeys = new Set(completedAtList.map(toDateKey));
  const today = new Date();

  let cursor = new Date(today);
  if (!dateKeys.has(toDateKey(cursor.toISOString()))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!dateKeys.has(toDateKey(cursor.toISOString()))) {
      return 0; // hom nay va hom qua deu chua tap -> streak da dut
    }
  }

  let streak = 0;
  while (dateKeys.has(toDateKey(cursor.toISOString()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
