import { destroySession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  await destroySession();
  
  // Usar el host de la petición entrante para soportar proxies, Cloudflare tunnels y dominios personalizados
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const baseUrl = host ? `${proto}://${host}` : request.url;

  return NextResponse.redirect(new URL("/login", baseUrl));
}

export async function GET(request: NextRequest) {
  await destroySession();

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const baseUrl = host ? `${proto}://${host}` : request.url;

  return NextResponse.redirect(new URL("/login", baseUrl));
}
