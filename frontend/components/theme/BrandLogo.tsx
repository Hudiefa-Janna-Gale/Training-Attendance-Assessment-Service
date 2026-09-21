const ALT = "SOMNOG 9, Somali Network Operators Group";

/**
 * The SOMNOG 9 logo. Two files are drawn (the light and the dark artwork, in the 640px copies
 * made from public/images/somnog.png and somnogDark.png) and the CSS shows the one that suits the
 * current theme, so the right logo is there on the first paint, with no script.
 */
export default function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`brand-logo ${className}`.trim()}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="logo-light" src="/images/somnog-640.png" alt={ALT} width={640} height={229} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="logo-dark" src="/images/somnogDark-640.png" alt={ALT} width={640} height={229} />
    </span>
  );
}
