import type { ReactNode } from "react";

function Svg({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function CalendarIcon() {
  return (
    <Svg>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </Svg>
  );
}

export function RollCallIcon() {
  return (
    <Svg>
      <path d="M9 11l3 3 8-8" />
      <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
    </Svg>
  );
}

export function ClipboardIcon() {
  return (
    <Svg>
      <rect x="8" y="3" width="8" height="4" rx="1" />
      <path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
      <path d="M9 13h6M9 17h4" />
    </Svg>
  );
}

export function AwardIcon() {
  return (
    <Svg>
      <circle cx="12" cy="9" r="6" />
      <path d="M8.5 14.5L7 21l5-3 5 3-1.5-6.5" />
    </Svg>
  );
}

export function PlusIcon() {
  return (
    <Svg size={18}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function CloseIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg size={size}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

export function SunIcon() {
  return (
    <Svg size={18}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Svg>
  );
}

export function MoonIcon() {
  return (
    <Svg size={18}>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </Svg>
  );
}

export function MonitorIcon() {
  return (
    <Svg size={18}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </Svg>
  );
}

export function SearchIcon() {
  return (
    <Svg size={18}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </Svg>
  );
}

export function FilterIcon() {
  return (
    <Svg size={18}>
      <path d="M4 5h16l-6 7.5V19l-4-2v-4.5z" />
    </Svg>
  );
}

export function ChevronIcon() {
  return (
    <Svg size={16}>
      <path d="M6 9l6 6 6-6" />
    </Svg>
  );
}

/** A spreadsheet grid: the Excel download. */
export function SheetIcon() {
  return (
    <Svg size={18}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18M3 15h18M9 4v16" />
    </Svg>
  );
}

/** A page with a folded corner: the PDF download. */
export function DocumentIcon() {
  return (
    <Svg size={18}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </Svg>
  );
}
