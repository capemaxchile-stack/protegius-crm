"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type FontSize = "normal" | "medium" | "large";

export function ControlesAccesibilidad() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [fontSize, setFontSize] = useState<FontSize>("medium"); // Por defecto letra mediana más legible

  useEffect(() => {
    // 1. Cargar tema guardado
    const savedTheme = (localStorage.getItem("protegius_theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
    aplicarTema(savedTheme);

    // 2. Cargar tamaño de fuente guardado
    const savedFontSize = (localStorage.getItem("protegius_font_size") as FontSize) || "medium";
    setFontSize(savedFontSize);
    aplicarFontSize(savedFontSize);
  }, []);

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

  function aplicarFontSize(size: FontSize) {
    document.documentElement.setAttribute("data-font-size", size);
    localStorage.setItem("protegius_font_size", size);
  }

  function toggleTheme() {
    const nuevoTema = theme === "dark" ? "light" : "dark";
    setTheme(nuevoTema);
    aplicarTema(nuevoTema);
  }

  function cambiarFontSize(size: FontSize) {
    setFontSize(size);
    aplicarFontSize(size);
  }

  return (
    <div className="flex items-center justify-between gap-2 p-2 bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl text-xs">
      {/* Botón Tema Claro / Oscuro */}
      <button
        type="button"
        onClick={toggleTheme}
        title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-900 light:bg-white text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white border border-slate-800 dark:border-slate-800 light:border-slate-300 transition"
      >
        {theme === "dark" ? (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-medium">Claro</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] font-medium">Oscuro</span>
          </>
        )}
      </button>

      {/* Selector de Tamaño de Letra (A-, A, A+) */}
      <div className="flex items-center gap-1 bg-slate-900 dark:bg-slate-900 light:bg-white p-1 rounded-lg border border-slate-800 dark:border-slate-800 light:border-slate-300">
        <button
          type="button"
          onClick={() => cambiarFontSize("normal")}
          title="Tamaño de letra: Normal (100%)"
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
            fontSize === "normal"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          A
        </button>

        <button
          type="button"
          onClick={() => cambiarFontSize("medium")}
          title="Tamaño de letra: Mediana (110% - Recomendada)"
          className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition ${
            fontSize === "medium"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          A+
        </button>

        <button
          type="button"
          onClick={() => cambiarFontSize("large")}
          title="Tamaño de letra: Grande (120%)"
          className={`px-1.5 py-0.5 rounded text-xs font-black transition ${
            fontSize === "large"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          A++
        </button>
      </div>
    </div>
  );
}
