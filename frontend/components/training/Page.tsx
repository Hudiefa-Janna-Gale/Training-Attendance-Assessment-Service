/**
 * A page: a title bar that stays put while the content scrolls beneath it (so the main
 * action is always within reach), then the content.
 */
export default function Page({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="page-bar">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-sub">{subtitle}</p>
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </header>
      <div className="page-body">{children}</div>
    </>
  );
}
