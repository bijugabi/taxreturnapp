import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { getSupabaseServer, STORAGE_BUCKET } from "@/lib/supabase-server";

const MIME_BY_EXT: Record<string, string> = {
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
  ".pdf": "application/pdf",
  ".csv": "text/csv",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const relPath = url.searchParams.get("path");
  const downloadName = url.searchParams.get("name");

  if (!relPath) {
    return NextResponse.json(
      { error: "Parâmetro 'path' é obrigatório." },
      { status: 400 }
    );
  }

  if (relPath.includes("..") || path.isAbsolute(relPath)) {
    return NextResponse.json({ error: "Caminho inválido." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(relPath);

    if (error || !data) {
      return NextResponse.json(
        { error: "Arquivo não encontrado." },
        { status: 404 }
      );
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const fileName =
      typeof downloadName === "string" && downloadName.trim()
        ? downloadName.trim()
        : path.basename(relPath);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": getContentType(relPath),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (err) {
    console.error("Download:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao baixar arquivo." },
      { status: 500 }
    );
  }
}
