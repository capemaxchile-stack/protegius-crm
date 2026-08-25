import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Protegius CRM — Sistema de Gestión Comercial",
  description: "Plataforma de gestión comercial, oportunidades, propuestas y clientes para Protegius.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
