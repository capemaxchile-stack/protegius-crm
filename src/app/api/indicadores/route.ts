import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Cachear por 1 hora

export interface IndicadoresData {
  uf: { valor: number; fecha: string };
  dolar: { valor: number; fecha: string };
  utm: { valor: number; fecha: string };
  euro?: { valor: number; fecha: string };
  fechaConsulta: string;
}

export async function GET() {
  const fallback: IndicadoresData = {
    uf: { valor: 38250.4, fecha: new Date().toISOString() },
    dolar: { valor: 942.5, fecha: new Date().toISOString() },
    utm: { valor: 67340.0, fecha: new Date().toISOString() },
    euro: { valor: 1025.8, fecha: new Date().toISOString() },
    fechaConsulta: new Date().toISOString(),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch("https://mindicador.cl/api", {
      signal: controller.signal,
      next: { revalidate: 3600 },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(fallback);
    }

    const data = await res.json();

    const resultado: IndicadoresData = {
      uf: {
        valor: data.uf?.valor || fallback.uf.valor,
        fecha: data.uf?.fecha || fallback.uf.fecha,
      },
      dolar: {
        valor: data.dolar?.valor || fallback.dolar.valor,
        fecha: data.dolar?.fecha || fallback.dolar.fecha,
      },
      utm: {
        valor: data.utm?.valor || fallback.utm.valor,
        fecha: data.utm?.fecha || fallback.utm.fecha,
      },
      euro: {
        valor: data.euro?.valor || fallback.euro?.valor,
        fecha: data.euro?.fecha || fallback.euro?.fecha,
      },
      fechaConsulta: new Date().toISOString(),
    };

    return NextResponse.json(resultado);
  } catch (e) {
    console.error("Error al consultar mindicador.cl, usando fallback:", e);
    return NextResponse.json(fallback);
  }
}
