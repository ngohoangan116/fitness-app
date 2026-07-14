export function DumbbellIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect x="2" y="9" width="3.5" height="6" rx="1" fill="currentColor" />
      <rect x="18.5" y="9" width="3.5" height="6" rx="1" fill="currentColor" />
    </svg>
  );
}

export function BarbellPlateIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M2 12H22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="0.5" y="7.5" width="3" height="9" rx="0.8" fill="currentColor" />
      <rect x="20.5" y="7.5" width="3" height="9" rx="0.8" fill="currentColor" />
      <rect x="4" y="5.5" width="2.6" height="13" rx="0.8" fill="currentColor" />
      <rect x="17.4" y="5.5" width="2.6" height="13" rx="0.8" fill="currentColor" />
    </svg>
  );
}

export function CableIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M4 4V16C4 18 6 19 8 19H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="4" cy="4" r="2" fill="currentColor" />
      <rect x="12" y="16" width="6" height="4" rx="0.8" fill="currentColor" />
    </svg>
  );
}

export function MachineIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="3" y="4" width="4" height="16" rx="0.8" fill="currentColor" />
      <path d="M7 8H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 16H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function BandIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M3 12C3 6 8 4 12 8C16 12 8 16 12 20C16 16 21 18 21 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BodyweightIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="12" cy="4" r="2" fill="currentColor" />
      <path
        d="M12 7V14M12 10L6 8M12 10L18 8M12 14L7 20M12 14L17 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Chọn icon phù hợp theo trường equipment của bài tập — dùng làm ảnh minh
// hoạ tạm thời cho các bài chưa có ảnh chụp/GIF riêng, thay vì để trống.
export function equipmentIconFor(equipment: string | null | undefined) {
  const e = (equipment || "").toLowerCase();
  if (e.includes("dumbbell") || e.includes("tạ đơn")) return DumbbellIcon;
  if (e.includes("barbell") || e.includes("tạ đòn")) return BarbellPlateIcon;
  if (e.includes("cable") || e.includes("cáp")) return CableIcon;
  if (e.includes("machine") || e.includes("máy")) return MachineIcon;
  if (e.includes("band") || e.includes("kháng lực")) return BandIcon;
  return BodyweightIcon;
}
