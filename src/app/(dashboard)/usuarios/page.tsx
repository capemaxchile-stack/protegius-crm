import { redirect } from "next/navigation";

export default function UsuariosPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const tab = searchParams?.tab === "permisos" ? "permisos" : "usuarios";
  redirect(`/configuracion?tab=${tab}`);
}
