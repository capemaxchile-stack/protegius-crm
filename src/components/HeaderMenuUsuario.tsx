"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { UserRole, USER_ROLE_LABELS } from "@/lib/constants";
import { cambiarMiPasswordAction } from "@/lib/actions-perfil";
import {
  User,
  ChevronDown,
  Moon,
  Sun,
  KeyRound,
  LogOut,
  Shield,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

type FontSize = "normal" | "medium" | "large";

interface HeaderMenuUsuarioProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

export function HeaderMenuUsuario({ user }: HeaderMenuUsuarioProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);

  // Estados de Accesibilidad y Tema
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [fontSize, setFontSize] = useState<FontSize>("medium");

  // Estados de Cambio de Contraseña
  const [passwordActual, setPasswordActual] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [mostrarPasswords, setMostrarPasswords] = useState(false);
  const [mensajePassword, setMensajePassword] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cargar preferencias de tema y fuente
    const savedTheme = (localStorage.getItem("protegius_theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
    aplicarTema(savedTheme);

    const savedFontSize = (localStorage.getItem("protegius_font_size") as FontSize) || "medium";
    setFontSize(savedFontSize);
    aplicarFontSize(savedFontSize);
  }, []);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAbierto(false);
      }
    }
    if (menuAbierto) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuAbierto]);

  function aplicarTema(t: "dark" | "light") {
    if (t === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
    localStorage.setItem("protegius_theme", t);
  }

  function toggleTheme() {
    const nuevoTema = theme === "dark" ? "light" : "dark";
    setTheme(nuevoTema);
    aplicarTema(nuevoTema);
  }

  function aplicarFontSize(size: FontSize) {
    document.documentElement.setAttribute("data-font-size", size);
    localStorage.setItem("protegius_font_size", size);
  }

  function cambiarFontSize(size: FontSize) {
    setFontSize(size);
    aplicarFontSize(size);
  }

  const handleCambiarPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setMensajePassword(null);

    startTransition(async () => {
      const res = await cambiarMiPasswordAction(passwordActual, nuevaPassword, confirmarPassword);
      if (res.success) {
        setMensajePassword({
          tipo: "ok",
          texto: "¡Contraseña actualizada con éxito!",
        });
        setPasswordActual("");
        setNuevaPassword("");
        setConfirmarPassword("");
        setTimeout(() => {
          setModalPasswordAbierto(false);
          setMensajePassword(null);
        }, 1800);
      } else {
        setMensajePassword({
          tipo: "error",
          texto: res.error || "Error al actualizar contraseña.",
        });
      }
    });
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* Botón Trigger de Usuario en el TopBar */}
        <button
          type="button"
          onClick={() => setMenuAbierto(!menuAbierto)}
          className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition shadow-xs text-left"
          title="Menú de perfil y visualización"
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              {user.name.split(" ")[0]}
            </p>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold leading-tight">
              {USER_ROLE_LABELS[user.role] || user.role}
            </p>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              menuAbierto ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Menú Desplegable Flotante */}
        {menuAbierto && (
          <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* Header del Perfil */}
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                    <Shield className="w-2.5 h-2.5" />
                    <span>{USER_ROLE_LABELS[user.role] || user.role}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Opciones de Visualización (Tema y Tamaño de Fuente) */}
            <div className="space-y-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Visualización & Accesibilidad
              </span>

              <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl">
                {/* Botón Modo Claro / Oscuro */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-xs hover:border-blue-400 transition"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span>Claro</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Oscuro</span>
                    </>
                  )}
                </button>

                {/* Botones Tamaño de Letra */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => cambiarFontSize("normal")}
                    title="Letra Normal"
                    className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                      fontSize === "normal"
                        ? "bg-blue-600 text-white"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={() => cambiarFontSize("medium")}
                    title="Letra Mediana (Recomendada)"
                    className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                      fontSize === "medium"
                        ? "bg-blue-600 text-white"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    A+
                  </button>
                  <button
                    type="button"
                    onClick={() => cambiarFontSize("large")}
                    title="Letra Grande"
                    className={`px-2 py-1 rounded text-xs font-bold transition ${
                      fontSize === "large"
                        ? "bg-blue-600 text-white"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    A++
                  </button>
                </div>
              </div>
            </div>

            {/* Seguridad: Cambiar Contraseña */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setMenuAbierto(false);
                  setModalPasswordAbierto(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
              >
                <KeyRound className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Cambiar mi contraseña</span>
              </button>
            </div>

            {/* Salir / Logout */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar sesión</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Modal para Cambiar Contraseña */}
      {modalPasswordAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Cambiar Mi Contraseña
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ingresa tu clave actual y define una nueva clave segura.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalPasswordAbierto(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {mensajePassword && (
              <div
                className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  mensajePassword.tipo === "ok"
                    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                    : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400"
                }`}
              >
                {mensajePassword.tipo === "ok" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{mensajePassword.texto}</span>
              </div>
            )}

            <form onSubmit={handleCambiarPassword} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <input
                    type={mostrarPasswords ? "text" : "password"}
                    required
                    value={passwordActual}
                    onChange={(e) => setPasswordActual(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPasswords(!mostrarPasswords)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {mostrarPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nueva Contraseña (mínimo 8 caracteres)
                </label>
                <input
                  type={mostrarPasswords ? "text" : "password"}
                  required
                  minLength={8}
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type={mostrarPasswords ? "text" : "password"}
                  required
                  minLength={8}
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalPasswordAbierto(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {isPending ? "Guardando..." : "Actualizar Contraseña"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
