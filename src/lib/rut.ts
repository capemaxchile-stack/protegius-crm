/**
 * Utilidades para validación y formateo de RUT chileno (Módulo 11)
 */

export function limpiarRUT(rut: string): string {
  return rut.replace(/[^0-9kK]/g, "").toUpperCase();
}

export function validarRUT(rut: string | null | undefined): boolean {
  if (!rut) return false;
  const limpio = limpiarRUT(rut);
  if (limpio.length < 8 || limpio.length > 9) return false;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1).toUpperCase();

  // Algoritmo Módulo 11
  let suma = 0;
  let multiplo = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }

  const dvEsperadoCalculado = 11 - (suma % 11);
  let dvEsperado = "";

  if (dvEsperadoCalculado === 11) {
    dvEsperado = "0";
  } else if (dvEsperadoCalculado === 10) {
    dvEsperado = "K";
  } else {
    dvEsperado = dvEsperadoCalculado.toString();
  }

  return dv === dvEsperado;
}

export function formatearRUT(rut: string | null | undefined): string {
  if (!rut) return "";
  const limpio = limpiarRUT(rut);
  if (limpio.length < 2) return limpio;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);

  // Formatear cuerpo con puntos
  let formateado = "";
  let cont = 0;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    formateado = cuerpo[i] + formateado;
    cont++;
    if (cont === 3 && i > 0) {
      formateado = "." + formateado;
      cont = 0;
    }
  }

  return `${formateado}-${dv}`;
}
