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
  Download,
  ArrowLeft,
  Building2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { validarRUT } from "@/lib/rut";
import * as XLSX from "xlsx";

interface ImportadorFormProps {
  usuarios?: { id: string; name: string }[];
}

export function ImportadorForm({ usuarios = [] }: ImportadorFormProps) {
  const [textoCSV, setTextoCSV] = useState("");
  const [responsableId, setResponsableId] = useState<string>("");
  const [filasParseadas, setFilasParseadas] = useState<
    (FilaImportacion & { rutValido?: boolean })[]
  >([]);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);

  // Mapeo inteligente de encabezados
  function detectarIndiceColumna(encabezados: string[], posiblesNombres: string[]): number {
    return encabezados.findIndex((h) => {
      const normalizado = h.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
      return posiblesNombres.some((p) => normalizado.includes(p));
    });
  }

  // Parsear arreglo de filas (desde Excel o CSV)
  function procesarFilasMatriz(matriz: (string | number | null | undefined)[][]) {
    if (matriz.length === 0) {
      setFilasParseadas([]);
      return;
    }

    // Primera fila como encabezados
    const encabezados = matriz[0].map((c) => String(c || "").trim());

    const idxRazon = detectarIndiceColumna(encabezados, ["razon", "empresa", "compania", "cliente", "organizacion"]);
    const idxRut = detectarIndiceColumna(encabezados, ["rut", "identificador", "cuit"]);
    const idxRubro = detectarIndiceColumna(encabezados, ["rubro", "giro", "industria", "actividad", "sector"]);
    const idxContacto = detectarIndiceColumna(encabezados, ["contacto", "nombre", "persona", "responsable", "contact"]);
    const idxEmail = detectarIndiceColumna(encabezados, ["email", "correo", "mail"]);
    const idxTelefono = detectarIndiceColumna(encabezados, ["telefono", "celular", "movil", "fono", "phone"]);
    const idxCargo = detectarIndiceColumna(encabezados, ["cargo", "puesto", "posicion", "title"]);

    const filas: (FilaImportacion & { rutValido?: boolean })[] = [];

    // Si no encontró coincidencia de encabezados, asumir orden por defecto:
    // 0: RazonSocial, 1: RUT, 2: Rubro, 3: Contacto, 4: Email, 5: Teléfono, 6: Cargo
    const defaultIdx = {
      razon: idxRazon !== -1 ? idxRazon : 0,
      rut: idxRut !== -1 ? idxRut : 1,
      rubro: idxRubro !== -1 ? idxRubro : 2,
      contacto: idxContacto !== -1 ? idxContacto : 3,
      email: idxEmail !== -1 ? idxEmail : 4,
      telefono: idxTelefono !== -1 ? idxTelefono : 5,
      cargo: idxCargo !== -1 ? idxCargo : 6,
    };

    for (let i = 1; i < matriz.length; i++) {
      const fila = matriz[i];
      if (!fila || fila.length === 0) continue;

      const razonSocial = String(fila[defaultIdx.razon] || "").trim();
      if (!razonSocial) continue;

      const rut = String(fila[defaultIdx.rut] || "").trim();
      const rubro = String(fila[defaultIdx.rubro] || "").trim();
      const nombreContacto = String(fila[defaultIdx.contacto] || "").trim();
      const emailContacto = String(fila[defaultIdx.email] || "").trim();
      const telefonoContacto = String(fila[defaultIdx.telefono] || "").trim();
      const cargoContacto = String(fila[defaultIdx.cargo] || "").trim();

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

  // Parsear texto pegado
  function parsearTextoPegado(texto: string) {
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

    const matriz = lineas.map((linea) => {
      const separador = linea.includes("\t")
        ? "\t"
        : linea.includes(";")
        ? ";"
        : ",";
      return linea.split(separador).map((c) => c.trim().replace(/^["']|["']$/g, ""));
    });

    procesarFilasMatriz(matriz);
  }

  // Cargar archivo .xlsx, .xls o .csv
  function handleCargarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setResultado(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const matriz: (string | number | null | undefined)[][] = XLSX.utils.sheet_to_json(
          worksheet,
          { header: 1 }
        );
        procesarFilasMatriz(matriz);
      } catch (err) {
        console.error("Error al leer archivo Excel/CSV:", err);
        alert("No se pudo procesar el archivo. Asegúrate de que sea un Excel (.xlsx, .xls) o CSV válido.");
      }
    };

    reader.readAsArrayBuffer(file);
  }

  async function handleImportar() {
    if (filasParseadas.length === 0) return;
    setCargando(true);
    try {
      const res = await importarCuentasAction(filasParseadas, responsableId || null);
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
    const wsData = [
      ["Razón Social", "RUT", "Rubro", "Nombre Contacto", "Email", "Teléfono", "Cargo"],
      ["Agrocomercial Los Andes SpA", "76.456.789-K", "Agricultura", "Carlos Pérez", "carlos@losandes.cl", "+56987654321", "Gerente General"],
      ["Constructora Santa María Ltda", "77.123.456-7", "Construcción", "María González", "maria@santamaria.cl", "+56912345678", "Jefa de Adquisiciones"],
      ["Transportes del Sur SA", "76.999.888-2", "Logística y Carga", "Pedro Soto", "pedro@transur.cl", "+56998877665", "Gerente de Operaciones"],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Contactos");
    XLSX.writeFile(wb, "plantilla_importacion_protegius.xlsx");
  }

  return (
    <div className="space-y-6">
      {/* Action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/prospeccion"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Importador Inteligente de Contactos
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Excel (.xlsx, .xls) & CSV
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Sube tu base de datos de empresas y contactos para comenzar el barrido comercial en minutos.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={descargarPlantillaEjemplo}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-sm transition"
        >
          <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Descargar Plantilla Excel</span>
        </button>
      </div>

      {/* Result feedback banner */}
      {resultado && (
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Resumen del Proceso de Importación</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Procesadas</span>
              <span className="font-black text-slate-900 dark:text-white text-base">{resultado.totalProcesados}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Nuevas Empresas</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">{resultado.creados}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Actualizadas / Existentes</span>
              <span className="font-black text-blue-600 dark:text-blue-400 text-base">{resultado.actualizados}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Con Observaciones</span>
              <span className="font-black text-rose-600 dark:text-rose-400 text-base">{resultado.fallidos}</span>
            </div>
          </div>

          {resultado.errores.length > 0 && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-700 dark:text-rose-300 text-xs space-y-1">
              <p className="font-bold">Detalle de observaciones:</p>
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
              href="/prospeccion"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <span>Ir al Centro de Prospección & Llamadas &rarr;</span>
            </Link>
          </div>
        </div>
      )}

      {/* Input area: Paste or Upload file */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Subir Archivo Excel o Pegar Datos</h2>
            </div>
          </div>

          {/* Drag and Drop / File upload zone */}
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center hover:border-blue-500 dark:hover:border-blue-500 transition duration-150 bg-slate-50/50 dark:bg-slate-950/40">
            <UploadCloud className="w-10 h-10 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Arrastra o selecciona tu archivo Excel (.xlsx, .xls) o CSV
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 mb-3">
              Detecta automáticamente columnas de Razón Social, Contacto, Teléfono, Correo, etc.
            </p>
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition">
              <span>Examinar Archivo</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={handleCargarArchivo}
                className="hidden"
              />
            </label>
          </div>

          {/* O pegar texto directo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              O pega las filas copiadas directamente de tu Excel:
            </label>
            <textarea
              rows={4}
              value={textoCSV}
              onChange={(e) => parsearTextoPegado(e.target.value)}
              placeholder={`Pega aquí tus filas de Excel (Razón Social | RUT | Rubro | Nombre Contacto | Email | Teléfono | Cargo)`}
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Options & Format instructions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 text-xs">
          {/* Asignación de Ejecutiva */}
          {usuarios.length > 0 && (
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800 space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs">
                Asignar estos contactos a:
              </label>
              <select
                value={responsableId}
                onChange={(e) => setResponsableId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">— A quien esté importando (Por defecto) —</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500">
                La ejecutiva seleccionada verá estos prospectos en su filtro &quot;Mis Asignados&quot;.
              </p>
            </div>
          )}

          <h3 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
            Columnas Soportadas
          </h3>

          <div className="space-y-2 text-slate-600 dark:text-slate-400 text-[11px]">
            <p>
              <strong className="text-slate-900 dark:text-white">Empresa / Razón Social:</strong> Obligatorio.
            </p>
            <p>
              <strong className="text-slate-900 dark:text-white">Nombre Contacto:</strong> Crea la persona de contacto.
            </p>
            <p>
              <strong className="text-slate-900 dark:text-white">Teléfono / Celular:</strong> Habilita click-to-call y WhatsApp.
            </p>
            <p>
              <strong className="text-slate-900 dark:text-white">Correo Electrónico:</strong> Email para envío de información.
            </p>
            <p>
              <strong className="text-slate-900 dark:text-white">Cargo / Rubro:</strong> Contexto comercial para la llamada.
            </p>
          </div>
        </div>
      </div>

      {/* Preview Table before importing */}
      {filasParseadas.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Vista Previa ({filasParseadas.length} contactos detectados)</span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Revisa los datos antes de confirmar la importación a la cola de llamadas.
              </p>
            </div>

            <button
              type="button"
              disabled={cargando}
              onClick={handleImportar}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{cargando ? "Importando registros..." : "Confirmar e Importar a Prospección"}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Empresa / Razón Social</th>
                  <th className="py-2.5 px-3">Contacto</th>
                  <th className="py-2.5 px-3">Teléfono</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Cargo</th>
                  <th className="py-2.5 px-3">Rubro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {filasParseadas.map((f, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-slate-400">{i + 1}</td>
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{f.razonSocial}</td>
                    <td className="py-2 px-3 font-medium">{f.nombreContacto || "—"}</td>
                    <td className="py-2 px-3 font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                      {f.telefonoContacto || "—"}
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{f.emailContacto || "—"}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{f.cargoContacto || "—"}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{f.rubro || "—"}</td>
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
