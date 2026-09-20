import NavLinks from "./NavLinks";

/** Sidebar + header around every /training page. */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">✦</span>
          <span>Training Hub</span>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <NavLinks />
      </aside>

      <main className="main">
        <header className="header">
          <div className="crumb">
            Training / <strong>Attendance &amp; Assessment</strong>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
