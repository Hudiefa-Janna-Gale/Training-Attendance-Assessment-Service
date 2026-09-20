"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// One entry per responsibility in the service brief: sessions and their facilitators/topics,
// daily attendance, assessments and scores, and the final PASS/FAIL result.
const links = [
  { href: "/training/sessions", icon: "◷", label: "Sessions" },
  { href: "/training/attendance", icon: "✓", label: "Attendance" },
  { href: "/training/assessments", icon: "✎", label: "Assessments" },
  { href: "/training/results", icon: "★", label: "Final Results" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main">
      {links.map(({ href, icon, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`nav-link${active ? " active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="nav-icon" aria-hidden="true">{icon}</span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
