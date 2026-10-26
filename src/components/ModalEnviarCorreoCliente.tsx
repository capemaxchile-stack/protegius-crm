"use client";

import { useState, useTransition } from "react";
import { Mail, Send, X, Sparkles } from "lucide-react";
import { PlantillaCorreo } from "@/lib/plantillas-correo-types";
import { enviarCorreoClienteAction } from "@/lib/plantillas-correo";

interface ContactoItem {
  id: string;
  persona: {
    id: string;
    nombre: string;
    email?: string | null;
  };
}

interface ModalEnviarCorreoClienteProps {
  cuentaId: string;
  razonSocial: string;
  contactos: ContactoItem[];
  plantillas: PlantillaCorreo[];
  ejecutivo: {
    name: string;
    email: string;
    telefono?: string | null;
    cargo?: string | null;
  };
}

export function ModalEnviarCorreoCliente({
  cuentaId,
  razonSocial,
  contactos,
  plantillas,
  ejecutivo,
}: ModalEnviarCorreoClienteProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const contactoInicial = contactos.find((c) => c.persona.email) || contactos[0];
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(
    contactoInicial?.persona.id || ""
  );
  const [emailDestino, setEmailDestino] = useState<string>(
    contactoInicial?.persona.email || ""
  );
  const [plantillaSeleccionadaId, setPlantillaSeleccionadaId] = useState<string>(
    plantillas[0]?.id || ""
  );
  const [asunto, setAsunto] = useState<string>("");
  const [cuerpoHtml, setCuerpoHtml] = useState<string>("");
  const [feedback, setFeedback] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  const aplicarPlantilla = (plantillaId: string, personaId: string) => {
    const pl = plantillas.find((p) => p.id === plantillaId);
    if (!pl) return;

    const cont = contactos.find((c) => c.persona.id === personaId);
    const nombreContacto = cont?.persona.nombre || "Estimado cliente";
    const cargoEjecutivo = ejecutivo.cargo || "Ejecutivo Comercial";
    const fonoEjecutivo = ejecutivo.telefono || "+56 2 2940 2000";

    const nuevoAsunto = pl.asunto
      .replace(/\{\{razonSocial\}\}/g, razonSocial)
      .replace(/\{\{contacto\}\}/g, nombreContacto);

    const nuevoCuerpo = pl.cuerpo
      .replace(/\{\{razonSocial\}\}/g, razonSocial)
      .replace(/\{\{contacto\}\}/g, nombreContacto)
      .replace(/\{\{ejecutivoNombre\}\}/g, ejecutivo.name)
      .replace(/\{\{ejecutivoCargo\}\}/g, cargoEjecutivo)
      .replace(/\{\{ejecutivoEmail\}\}/g, ejecutivo.email)
      .replace(/\{\{ejecutivoTelefono\}\}/g, fonoEjecutivo);

    setAsunto(nuevoAsunto);
    setCuerpoHtml(nuevoCuerpo);
  };

  const handleOpenModal = () => {
    setOpen(true);
    setFeedback(null);
    aplicarPlantilla(plantillaSeleccionadaId, selectedPersonaId);
  };

  const handleSelectContacto = (personaId: string) => {
    setSelectedPersonaId(personaId);
    const cont = contactos.find((c) => c.persona.id === personaId);
    if (cont?.persona.email) {
      setEmailDestino(cont.persona.email);
    }
    aplicarPlantilla(plantillaSeleccionadaId, personaId);
  };

  const handleSelectPlantilla = (plantillaId: string) => {
    setPlantillaSeleccionadaId(plantillaId);
    aplicarPlantilla(plantillaId, selectedPersonaId);
  };

  const handleEnviar = () => {
    if (!emailDestino.trim()) {
      setFeedback({ tipo: "error", texto: "Debes ingresar el correo del destinatario." });
      return;
    }
    if (!asunto.trim()) {
      setFeedback({ tipo: "error", texto: "El asunto del correo no puede estar vacío." });
      return;
    }

    startTransition(async () => {
      setFeedback(null);
      const res = await enviarCorreoClienteAction({
        cuentaId,
        personaId: selectedPersonaId || undefined,
        destinatarioEmail: emailDestino.trim(),
        destinatarioNombre: contactos.find((c) => c.persona.id === selectedPersonaId)?.persona.nombre,
        asunto: asunto.trim(),
        cuerpoHtml: cuerpoHtml,
      });

      if (res.success) {
        setFeedback({
          tipo: "ok",
          texto: "¡Correo enviado con éxito! Se registró automáticamente en el historial.",
        });
        setTimeout(() => setOpen(false), 2000);
      } else {
        setFeedback({ tipo: "error", texto: res.error || "Error al enviar el correo." });
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpenModal}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-semibold text-xs border border-blue-200 dark:border-blue-500/20 shadow-sm transition"
      >
        <Mail className="w-3.5 h-3.5" />
        <span>Enviar Correo</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Enviar Correo Corporativo
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {razonSocial} · Remitente: {ejecutivo.name} ({ejecutivo.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {feedback && (
              <div
                className={`my-3 p-3 rounded-xl text-xs font-semibold shrink-0 border ${
                  feedback.tipo === "ok"
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                }`}
              >
                {feedback.texto}
              </div>
            )}

            <div className="space-y-4 my-4 overflow-y-auto pr-1 flex-1 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Plantilla Corporativa
                  </label>
                  <div className="relative">
                    <select
                      value={plantillaSeleccionadaId}
                      onChange={(e) => handleSelectPlantilla(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {plantillas.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contacto Destinatario
                  </label>
                  <select
                    value={selectedPersonaId}
                    onChange={(e) => handleSelectContacto(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">— Sin contacto específico —</option>
                    {contactos.map((c) => (
                      <option key={c.persona.id} value={c.persona.id}>
                        {c.persona.nombre} {c.persona.email ? `(${c.persona.email})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico del Cliente
                </label>
                <input
                  type="email"
                  value={emailDestino}
                  onChange={(e) => setEmailDestino(e.target.value)}
                  placeholder="ejemplo@cliente.cl"
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Asunto del Correo
                </label>
                <input
                  type="text"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  placeholder="Asunto formal"
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cuerpo del Mensaje (con firma del ejecutivo)
                  </label>
                  <button
                    type="button"
                    onClick={() => aplicarPlantilla(plantillaSeleccionadaId, selectedPersonaId)}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-bold"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Regenerar plantilla</span>
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={cuerpoHtml}
                  onChange={(e) => setCuerpoHtml(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleEnviar}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isPending ? "Enviando..." : "Enviar Correo al Cliente"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
