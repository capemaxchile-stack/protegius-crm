import { requireAuth } from "@/lib/auth";
import { ImportadorForm } from "./ImportadorForm";

export default async function ImportarCuentasPage() {
  await requireAuth();

  return <ImportadorForm />;
}
