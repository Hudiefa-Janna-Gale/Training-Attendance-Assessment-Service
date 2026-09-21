import AppShell from "@/components/training/AppShell";

// The shell (navigation, logo, theme switch) is static. Each page prerenders its own frame too, and
// streams in only what it reads from the Training service, inside a <Suspense> boundary.
export default function TrainingLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
