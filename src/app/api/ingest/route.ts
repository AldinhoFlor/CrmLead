import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  mapCsvText,
  toIngestLead,
  normalizeJsonLead,
  type IngestLead,
} from "@/lib/lead-mapping";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LEADS = 1000;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-ingest-token, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth && /^bearer /i.test(auth)) return auth.slice(7).trim();
  return (
    req.headers.get("x-ingest-token") ||
    req.nextUrl.searchParams.get("token")
  );
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS });
}

export async function POST(req: NextRequest) {
  const token = getToken(req);
  if (!token) return json({ error: "Token ausente" }, 401);

  const ctype = req.headers.get("content-type") || "";
  let leads: IngestLead[] = [];

  try {
    if (ctype.includes("application/json")) {
      const body = await req.json();
      if (body && typeof body.csv === "string") {
        leads = mapCsvText(body.csv).map(toIngestLead);
      } else {
        const arr = Array.isArray(body)
          ? body
          : Array.isArray(body?.leads)
            ? body.leads
            : null;
        if (!arr) {
          return json(
            { error: "Envie um array em 'leads', ou 'csv' (texto), ou CSV puro no corpo." },
            400
          );
        }
        leads = (arr as Record<string, unknown>[])
          .map(normalizeJsonLead)
          .filter((x): x is IngestLead => x !== null);
      }
    } else {
      // Assume raw CSV (text/csv, text/plain, etc.)
      const text = await req.text();
      leads = mapCsvText(text).map(toIngestLead);
    }
  } catch {
    return json({ error: "Corpo inválido — envie JSON ou CSV." }, 400);
  }

  if (!leads.length) return json({ error: "Nenhum lead válido no corpo." }, 400);
  if (leads.length > MAX_LEADS) leads = leads.slice(0, MAX_LEADS);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("ingest_leads", {
    p_secret: token,
    p_leads: leads,
  });

  if (error) {
    const unauth = /unauthorized/i.test(error.message);
    return json(
      { error: unauth ? "Token inválido" : error.message },
      unauth ? 401 : 500
    );
  }

  return json({ ok: true, ...(data as object) });
}
