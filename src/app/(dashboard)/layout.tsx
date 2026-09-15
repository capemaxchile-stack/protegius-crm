import { requireAuth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100 print:bg-white print:text-slate-900 transition-colors duration-150">
      <Sidebar
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }}
      />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <TopBar
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }}
        />
        <main className="flex-1 overflow-y-auto bg-slate-100/60 dark:bg-slate-950/80 print:bg-white print:overflow-visible print:p-0 print:m-0">
          <div className="p-8 max-w-7xl mx-auto print:p-0 print:max-w-none print:m-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
