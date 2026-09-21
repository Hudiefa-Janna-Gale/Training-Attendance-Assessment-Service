"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AwardIcon, CalendarIcon, ClipboardIcon, RollCallIcon } from "./Icons";

// One entry per responsibility in the service brief: sessions and their facilitators/topics,
// daily attendance, assessments and scores, and the final PASS/FAIL result.
const links = [
  { href: "/training/sessions", icon: <CalendarIcon />, label: "Sessions" },
  { href: "/training/attendance", icon: <RollCallIcon />, label: "Attendance" },
  { href: "/training/assessments", icon: <ClipboardIcon />, label: "Assessments" },
  { href: "/training/results", icon: <AwardIcon />, label: "Final results" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="nav" aria-label="Main">
      {links.map(({ href, icon, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`nav-link${active ? " active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="nav-icon">{icon}</span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
