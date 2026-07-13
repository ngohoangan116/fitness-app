export function FlameIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M10 1.5C10 4 7 5.5 7 9c0 1.4.7 2.3 1.4 3-0.3-1 0-2 0.9-2.8C9.5 10.8 9 9.5 9.7 8c0.7 1 2.3 2.2 2.3 4.5 0 1-0.3 1.8-0.8 2.5C13.3 14 15 12 15 9.5 15 6.5 12 5 12 2c0-0.3 0-0.5-0.1-0.7C11 2.5 10 2 10 1.5Z"
        fill="currentColor"
      />
      <path
        d="M6.8 12.5c0 3 2.3 5.5 5.2 5.5-2.6 0-3.6-1.8-3.6-3.4 0-1 .4-1.8 1-2.5-1.5 0-2.6.9-2.6 2.4Z"
        fill="currentColor"
        opacity="0.6"
      />
    </svg>
  );
}

export function CalendarIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="2.5" y="4" width="15" height="13.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 8H17.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 2V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 2V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="5.5" y="10.2" width="2.4" height="2.4" rx="0.4" fill="currentColor" />
    </svg>
  );
}
