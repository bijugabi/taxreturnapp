import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

interface Client {
  id: string;
  name: string;
  displayId?: string;
  createdAt: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function toClient(row: { id: string; name: string; display_id: string | null; created_at: string }): Client {
  return {
    id: row.id,
    name: row.name,
    displayId: row.display_id ?? undefined,
    createdAt: row.created_at,
  };
}

export async function GET() {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("clients")
      .select("id, name, display_id, created_at")
      .order("name");

    if (error) {
      console.error("Supabase clients GET:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const clients = (data || []).map(toClient);
    return NextResponse.json(clients);
  } catch (err) {
    console.error("Clients GET:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao listar clientes." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "Nome do cliente é obrigatório." },
        { status: 400 }
      );
    }

    const name = body.name.trim();
    const displayId =
      typeof body.displayId === "string" && body.displayId.trim()
        ? body.displayId.trim()
        : null;

    const supabase = getSupabaseServer();

    const { data: existingList } = await supabase
      .from("clients")
      .select("id, display_id")
      .ilike("name", name);

    const alreadyExists = (existingList || []).some(
      (c) => (c.display_id || "").toLowerCase() === (displayId || "").toLowerCase()
    );
    if (alreadyExists) {
      return NextResponse.json(
        { error: "Já existe um cliente com esse nome e ID." },
        { status: 400 }
      );
    }

    const baseId = slugify(displayId || name) || "client";
    const uniqueId = `${baseId}_${Date.now()}`;
    const createdAt = new Date().toISOString();

    const { data: inserted, error } = await supabase
      .from("clients")
      .insert({
        id: uniqueId,
        name,
        display_id: displayId,
        created_at: createdAt,
      })
      .select("id, name, display_id, created_at")
      .single();

    if (error) {
      console.error("Supabase clients POST:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(toClient(inserted), { status: 201 });
  } catch (err) {
    console.error("Clients POST:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao criar cliente." },
      { status: 500 }
    );
  }
}
