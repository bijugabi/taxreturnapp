import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer, STORAGE_BUCKET } from "@/lib/supabase-server";

interface HistoryEntry {
  id: string;
  clientId: string;
  clientName: string;
  quarter: string;
  year: string;
  salesCount: number;
  purchasesCount: number;
  fileName: string;
  downloadPath: string;
  uploadedFileNames?: string[];
  uploadedFiles?: { name: string; path: string }[];
  createdAt: string;
}

function toHistoryEntry(row: {
  id: string;
  client_id: string;
  client_name: string;
  quarter: string;
  year: string;
  sales_count: number;
  purchases_count: number;
  file_name: string;
  download_path: string;
  uploaded_file_names: string[] | null;
  uploaded_files: { name: string; path: string }[] | null;
  created_at: string;
}): HistoryEntry {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    quarter: row.quarter,
    year: row.year,
    salesCount: row.sales_count,
    purchasesCount: row.purchases_count,
    fileName: row.file_name,
    downloadPath: row.download_path,
    uploadedFileNames: row.uploaded_file_names ?? undefined,
    uploadedFiles: row.uploaded_files ?? undefined,
    createdAt: row.created_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const clientId = url.searchParams.get("clientId");

    const supabase = getSupabaseServer();
    let query = supabase
      .from("history")
      .select("*")
      .order("created_at", { ascending: false });

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase history GET:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const list = (data || []).map(toHistoryEntry);
    return NextResponse.json(list);
  } catch (err) {
    console.error("History GET:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao listar histórico." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Parâmetro 'id' é obrigatório." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    const { data: entry, error: fetchError } = await supabase
      .from("history")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !entry) {
      return NextResponse.json(
        { error: "Declaração não encontrada." },
        { status: 404 }
      );
    }

    const pathsToRemove: string[] = [];
    if (entry.download_path) {
      pathsToRemove.push(entry.download_path);
    }
    const uploadedFiles = entry.uploaded_files as { path: string }[] | null;
    if (Array.isArray(uploadedFiles)) {
      uploadedFiles.forEach((f) => f.path && pathsToRemove.push(f.path));
    }

    for (const filePath of pathsToRemove) {
      await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
    }

    const { error: deleteError } = await supabase.from("history").delete().eq("id", id);

    if (deleteError) {
      console.error("Supabase history DELETE:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("History DELETE:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao excluir declaração." },
      { status: 500 }
    );
  }
}
