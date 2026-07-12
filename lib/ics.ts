// Sinh file .ics (chuan iCalendar) de dong bo lich tap vao Google/Apple
// Calendar. Vi he thong khong biet khach ranh thu may trong tuan, ta chia
// deu cac buoi trong tuan bat dau tu Thu Hai gan nhat, lap lai hang tuan.

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIcsDate(d: Date) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(
    d.getHours()
  )}${pad(d.getMinutes())}00`;
}

function nextMonday(from: Date) {
  const d = new Date(from);
  const day = d.getDay(); // 0 = CN, 1 = T2, ...
  const diff = day === 1 ? 7 : ((8 - day) % 7) || 7;
  d.setDate(d.getDate() + diff);
  d.setHours(18, 0, 0, 0); // mac dinh 18:00, khach tu doi lai trong app lich
  return d;
}

export function buildWorkoutIcs(params: {
  planName: string;
  days: { dayNumber: number; label: string; exerciseNames: string[] }[];
}) {
  const { planName, days } = params;
  const dayCount = days.length;
  if (dayCount === 0) return "";

  // Rai deu cac buoi trong 7 ngay, vd 3 buoi -> T2/T4/T6 (offset 0,2,4)
  const offsets = Array.from({ length: dayCount }, (_, i) => Math.round((i * 7) / dayCount));

  const start = nextMonday(new Date());

  const events = days.map((d, i) => {
    const dtStart = new Date(start);
    dtStart.setDate(dtStart.getDate() + offsets[i]);
    const dtEnd = new Date(dtStart);
    dtEnd.setHours(dtEnd.getHours() + 1);

    const desc = d.exerciseNames.slice(0, 6).join("\\n");

    return [
      "BEGIN:VEVENT",
      `UID:sotap-${d.dayNumber}-${dtStart.getTime()}@sotap`,
      `DTSTAMP:${toIcsDate(new Date())}Z`,
      `DTSTART:${toIcsDate(dtStart)}`,
      `DTEND:${toIcsDate(dtEnd)}`,
      "RRULE:FREQ=WEEKLY;COUNT=12",
      `SUMMARY:Sổ Tập · ${d.label}`,
      `DESCRIPTION:${desc}`,
      "END:VEVENT",
    ].join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SoTap//WorkoutSchedule//VI",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:Lịch tập - ${planName}`,
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(icsContent: string, filename = "so-tap-lich-tap.ics") {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
