export default function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <h1 className="page-title">{title}</h1>
      <p className="sub">{subtitle}</p>
    </>
  );
}
