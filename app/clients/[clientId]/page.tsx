import Link from "next/link";
import ClientHistory from "./ClientHistory";
import { getSupabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

interface Client {
  id: string;
  name: string;
  displayId?: string;
  createdAt: string;
}

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

export default async function ClientDetailPage({
  params,
}: {
  params: { clientId: string };
}) {
  const { clientId } = params;
  const supabase = getSupabaseServer();

  const { data: clientRow } = await supabase
    .from("clients")
    .select("id, name, display_id, created_at")
    .eq("id", clientId)
    .single();

  if (!clientRow) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <p className="text-gray-600">Cliente não encontrado.</p>
          <Link href="/clients" className="text-blue-600 hover:underline mt-2 inline-block">
            Voltar à lista de clientes
          </Link>
        </div>
      </main>
    );
  }

  const client: Client = {
    id: clientRow.id,
    name: clientRow.name,
    displayId: clientRow.display_id ?? undefined,
    createdAt: clientRow.created_at,
  };

  const { data: historyRows } = await supabase
    .from("history")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  const entries = (historyRows || []).map(toHistoryEntry);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/clients"
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              ← Clientes
            </Link>
          </div>
          <Link
            href="/"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Ir para processamento
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900">
            {client.name}
          </h1>
          {client.displayId && (
            <p className="text-sm text-gray-500 mt-0.5">ID: {client.displayId}</p>
          )}
        </div>

        <ClientHistory entries={entries} />
      </div>
    </main>
  );
}
