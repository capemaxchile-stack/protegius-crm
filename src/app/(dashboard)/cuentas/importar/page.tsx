import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ImportadorForm } from "./ImportadorForm";

export default async function ImportarCuentasPage() {
  await requireAuth();

  const usuarios = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return <ImportadorForm usuarios={usuarios} />;
}
