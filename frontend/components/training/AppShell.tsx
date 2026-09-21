import BrandLogo from "@/components/theme/BrandLogo";
import ThemeDock from "@/components/theme/ThemeDock";
import NavLinks from "./NavLinks";

/**
 * Navigation rail (a bottom tab bar on phones) beside the scrolling page. The logo lives in the
 * rail on a laptop and in a strip above the page on a phone; the theme switch is a small tab on the
 * rail's edge, or a button in that strip. Each page draws its own sticky title bar, see Page.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <aside className="rail">
        <div className="brand">
          <BrandLogo />
          <p className="brand-name">Training Hub</p>
        </div>
        <NavLinks />
      </aside>
      <ThemeDock placement="edge" />
      <main className="main">
        <div className="mobile-brand">
          <BrandLogo />
          <ThemeDock placement="strip" />
        </div>
        {children}
      </main>
    </div>
  );
}
