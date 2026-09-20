import AppShell from "@/components/training/AppShell";

// Every page reads live data from the Training service, so nothing here may be
// prerendered at build time (the service is not running then).
export const dynamic = "force-dynamic";

export default function TrainingLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
