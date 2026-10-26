import { requireAdmin } from "@/lib/auth";
import { obtenerConfigAlertasAsync } from "@/lib/alertas-externas";
import { ConfiguracionView } from "./ConfiguracionView";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const config = await obtenerConfigAlertasAsync();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <ConfiguracionView config={config} />
    </div>
  );
}
