"use client";

import { useState } from "react";
import {
  importarCuentasAction,
  FilaImportacion,
  ResultadoImportacion,
} from "@/lib/actions-importar";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  ArrowLeft,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { validarRUT } from "@/lib/rut";

export function ImportadorForm() {
  const [textoCSV, setTextoCSV] = useState("");
  const [filasParseadas, setFilasParseadas] = useState<
    (FilaImportacion & { rutValido?: boolean })[]
  >([]);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);

  // Parsear texto CSV o pegado de Excel
  function parsearEntrada(texto: string) {
    setTextoCSV(texto);
    setResultado(null);

    const lineas = texto
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lineas.length === 0) {
      setFilasParseadas([]);
      return;
    }

    // Detectar si la primera fila es encabezado
    let inicio = 0;
    const primeraLinea = lineas[0].toLowerCase();
    if (
      primeraLinea.includes("razon") ||
      primeraLinea.includes("rut") ||
      primeraLinea.includes("empresa") ||
      primeraLinea.includes("contacto")
    ) {
      inicio = 1;
    }

    const filas: (FilaImportacion & { rutValido?: boolean })[] = [];

    for (let i = inicio; i < lineas.length; i++) {
      const linea = lineas[i];
      // Separador por coma, punto y coma o tabulación
      const separador = linea.includes("\t")
        ? "\t"
        : linea.includes(";")
        ? ";"
        : ",";
      const columnas = linea.split(separador).map((col) => col.trim().replace(/^["']|["']$/g, ""));

      if (columnas.length === 0 || !columnas[0]) continue;

      const razonSocial = columnas[0] || "";
      const rut = columnas[1] || "";
      const rubro = columnas[2] || "";
      const nombreContacto = columnas[3] || "";
      const emailContacto = columnas[4] || "";
      const telefonoContacto = columnas[5] || "";
      const cargoContacto = columnas[6] || "";

      let rutValido = true;
      if (rut) {
        rutValido = validarRUT(rut);
      }

      filas.push({
        razonSocial,
        rut,
        rubro,
        nombreContacto,
        emailContacto,
        telefonoContacto,
        cargoContacto,
        rutValido,
      });
    }

    setFilasParseadas(filas);
  }

  function handleCargarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const contenido = event.target?.result as string;
      parsearEntrada(contenido);
    };
    reader.readAsText(file, "UTF-8");
  }

  async function handleImportar() {
    if (filasParseadas.length === 0) return;
    setCargando(true);
    try {
      const res = await importarCuentasAction(filasParseadas);
      setResultado(res);
      if (res.creados > 0 || res.actualizados > 0) {
        setTextoCSV("");
        setFilasParseadas([]);
      }
    } catch {
      alert("Error al procesar la importación masiva.");
    } finally {
      setCargando(false);
    }
  }

  function descargarPlantillaEjemplo() {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Razon Social,RUT,Rubro,Contacto Nombre,Contacto Email,Contacto Telefono,Contacto Cargo\n" +
      "Agrocomercial Los Andes SpA,76.456.789-K,Agricultura y Exportacion,Carlos Perez,carlos@losandes.cl,+56987654321,Gerente General\n" +
      "Constructora Santa Maria Ltda,77.123.456-7,Construccion,Maria Gonzalez,maria@santamaria.cl,+56912345678,Jefa de Adquisiciones\n" +
      "Transportes del Sur SA,76.999.888-2,Logistica y Carga,Pedro Soto,pedro@transur.cl,+56998877665,Gerente de Operaciones";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plantilla_importacion_protegius.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      {/* Action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/cuentas"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Importador Masivo de Cuentas & Contactos
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Carga tu base de datos de empresas desde CSV o Excel con validación de RUT en un clic.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={descargarPlantillaEjemplo}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition shadow-sm"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Descargar Plantilla CSV</span>
        </button>
      </div>

      {/* Result feedback banner */}
      {resultado && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-sm">Resumen del Proceso de Importación</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Procesadas</span>
              <span className="font-bold text-white text-base">{resultado.totalProcesados}</span>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Nuevas Cuentas</span>
              <span className="font-bold text-emerald-400 text-base">{resultado.creados}</span>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Actualizadas</span>
              <span className="font-bold text-blue-400 text-base">{resultado.actualizados}</span>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <span className="text-slate-400 block">Con Observaciones</span>
              <span className="font-bold text-rose-400 text-base">{resultado.fallidos}</span>
            </div>
          </div>

          {resultado.errores.length > 0 && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs space-y-1">
              <p className="font-semibold">Detalle de observaciones:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {resultado.errores.map((err, i) => (
                  <li key={i}>
                    Fila {err.fila}: {err.razon}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Link
              href="/cuentas"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition"
            >
              Ver Directorio de Cuentas &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Input area: Paste or Upload file */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Pegar Datos o Subir Archivo</h2>
            </div>
            <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium">
              <UploadCloud className="w-4 h-4" />
              <span>Seleccionar Archivo CSV</span>
              <input
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleCargarArchivo}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <textarea
              rows={8}
              value={textoCSV}
              onChange={(e) => parsearEntrada(e.target.value)}
              placeholder={`Pega aquí tus datos copiados de Excel o CSV con este orden de columnas:\nRazón Social | RUT | Rubro | Nombre Contacto | Email | Teléfono | Cargo`}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Format instructions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3.5 text-xs">
          <h3 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
            Estructura de Columnas
          </h3>

          <div className="space-y-2 text-slate-400 text-[11px]">
            <p>
              <strong className="text-white">1. Razón Social:</strong> Obligatoria. Nombre de la empresa.
            </p>
            <p>
              <strong className="text-white">2. RUT:</strong> Opcional. Se valida automáticamente con Módulo 11.
            </p>
            <p>
              <strong className="text-white">3. Rubro:</strong> Opcional (ej: Minería, Logística, Retail).
            </p>
            <p>
              <strong className="text-white">4. Nombre Contacto:</strong> Opcional. Crea la persona vinculada.
            </p>
            <p>
              <strong className="text-white">5. Email:</strong> Correo del contacto.
            </p>
            <p>
              <strong className="text-white">6. Teléfono:</strong> Móvil o fijo de contacto.
            </p>
            <p>
              <strong className="text-white">7. Cargo:</strong> Cargo del contacto (ej: Gerente Comercial).
            </p>
          </div>
        </div>
      </div>

      {/* Preview Table before importing */}
      {filasParseadas.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Vista Previa ({filasParseadas.length} empresas detectadas)</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Revisa los datos antes de confirmar la importación a la base de datos.
              </p>
            </div>

            <button
              type="button"
              disabled={cargando}
              onClick={handleImportar}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{cargando ? "Importando registros..." : "Confirmar e Importar Cuentas"}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Razón Social</th>
                  <th className="py-2.5 px-3">RUT</th>
                  <th className="py-2.5 px-3">Rubro</th>
                  <th className="py-2.5 px-3">Contacto</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Cargo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filasParseadas.map((f, i) => (
                  <tr key={i} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-slate-500">{i + 1}</td>
                    <td className="py-2 px-3 font-semibold text-white">{f.razonSocial}</td>
                    <td className="py-2 px-3 font-mono">
                      {f.rut ? (
                        f.rutValido ? (
                          <span className="text-emerald-400">{f.rut}</span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{f.rut} (RUT Inválido)</span>
                          </span>
                        )
                      ) : (
                        <span className="text-slate-500 italic">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-400">{f.rubro || "—"}</td>
                    <td className="py-2 px-3">{f.nombreContacto || "—"}</td>
                    <td className="py-2 px-3 text-slate-400">{f.emailContacto || "—"}</td>
                    <td className="py-2 px-3 text-slate-400">{f.cargoContacto || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
