import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 1800; // Cachear por 30 minutos

export interface IndicadoresData {
  uf: { valor: number; fecha: string };
  dolar: { valor: number; fecha: string };
  utm: { valor: number; fecha: string };
  euro: { valor: number; fecha: string };
  fechaConsulta: string;
}

export async function GET() {
  const fallback: IndicadoresData = {
    uf: { valor: 40865.87, fecha: new Date().toISOString() },
    dolar: { valor: 914.64, fecha: new Date().toISOString() },
    utm: { valor: 71649.0, fecha: new Date().toISOString() },
    euro: { valor: 1066.64, fecha: new Date().toISOString() },
    fechaConsulta: new Date().toISOString(),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const [resUf, resDolar, resUtm, resEuro] = await Promise.allSettled([
      fetch("https://findic.cl/api/uf", { signal: controller.signal, next: { revalidate: 1800 } }),
      fetch("https://findic.cl/api/dolar", { signal: controller.signal, next: { revalidate: 1800 } }),
      fetch("https://findic.cl/api/utm", { signal: controller.signal, next: { revalidate: 1800 } }),
      fetch("https://findic.cl/api/euro", { signal: controller.signal, next: { revalidate: 1800 } }),
    ]);

    clearTimeout(timeoutId);

    let ufValor = fallback.uf.valor;
    let dolarValor = fallback.dolar.valor;
    let utmValor = fallback.utm.valor;
    let euroValor = fallback.euro.valor;

    if (resUf.status === "fulfilled" && resUf.value.ok) {
      const data = await resUf.value.json();
      if (data.serie?.[0]?.valor) ufValor = data.serie[0].valor;
    }

    if (resDolar.status === "fulfilled" && resDolar.value.ok) {
      const data = await resDolar.value.json();
      if (data.serie?.[0]?.valor) dolarValor = data.serie[0].valor;
    }

    if (resUtm.status === "fulfilled" && resUtm.value.ok) {
      const data = await resUtm.value.json();
      if (data.serie?.[0]?.valor) utmValor = data.serie[0].valor;
    }

    if (resEuro.status === "fulfilled" && resEuro.value.ok) {
      const data = await resEuro.value.json();
      if (data.serie?.[0]?.valor) euroValor = data.serie[0].valor;
    }

    const resultado: IndicadoresData = {
      uf: { valor: ufValor, fecha: new Date().toISOString() },
      dolar: { valor: dolarValor, fecha: new Date().toISOString() },
      utm: { valor: utmValor, fecha: new Date().toISOString() },
      euro: { valor: euroValor, fecha: new Date().toISOString() },
      fechaConsulta: new Date().toISOString(),
    };

    return NextResponse.json(resultado);
  } catch (e) {
    console.error("Error al consultar findic.cl, usando fallback actualizado:", e);
    return NextResponse.json(fallback);
  }
}
