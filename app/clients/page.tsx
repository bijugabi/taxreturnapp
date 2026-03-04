import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

interface Client {
  id: string;
  name: string;
  displayId?: string;
  createdAt: string;
}

interface HistoryRow {
  client_id: string;
  created_at: string;
}

export default async function ClientsPage() {
  let clients: Client[] = [];
  let history: HistoryRow[] = [];

  try {
    const supabase = getSupabaseServer();

    const { data: clientsData, error: clientsError } = await supabase
      .from("clients")
      .select("id, name, display_id, created_at")
      .order("name");

    if (clientsError) {
      console.error("Supabase clients error:", clientsError);
      throw new Error(clientsError.message);
    }

    const { data: historyData, error: historyError } = await supabase
      .from("history")
      .select("client_id, created_at")
      .order("created_at", { ascending: false });

    if (historyError) {
      console.error("Supabase history error:", historyError);
      throw new Error(historyError.message);
    }

    clients = (clientsData || []).map((r) => ({
      id: r.id,
      name: r.name,
      displayId: r.display_id ?? undefined,
      createdAt: r.created_at,
    }));

    history = (historyData || []) as HistoryRow[];
  } catch (err) {
    console.error("Clients page error:", err);
    return (
      <main className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <a href="/" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Voltar para processamento
            </a>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-amber-800 mb-2">
              Erro ao carregar clientes
            </h2>
            <p className="text-sm text-amber-700 mb-2">
              Não foi possível conectar ao Supabase. Verifique:
            </p>
            <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
              <li>Variáveis <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> e <code className="bg-amber-100 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> no Railway</li>
              <li>Se o arquivo <code className="bg-amber-100 px-1 rounded">supabase/schema.sql</code> foi executado no SQL Editor do Supabase (tabelas <code className="bg-amber-100 px-1 rounded">clients</code> e <code className="bg-amber-100 px-1 rounded">history</code>)</li>
            </ul>
            <p className="text-xs text-amber-600 mt-3">
              Detalhe: {err instanceof Error ? err.message : String(err)}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const statsByClient: Record<string, { count: number; lastUpdated: string | null }> = {};
  for (const client of clients) {
    statsByClient[client.id] = { count: 0, lastUpdated: null };
  }
  for (const h of history) {
    if (!statsByClient[h.client_id]) continue;
    statsByClient[h.client_id].count += 1;
    const created = h.created_at;
    const current = statsByClient[h.client_id].lastUpdated;
    if (!current || created > current) {
      statsByClient[h.client_id].lastUpdated = created;
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-semibold">C</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Clientes &amp; Histórico
              </h1>
              <p className="text-xs text-gray-500">
                Perfis de clientes e declarações processadas
              </p>
            </div>
          </div>
          <a
            href="/"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Voltar para processamento
          </a>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">
              Clientes
            </h2>
          </div>

          {clients.length === 0 ? (
            <div className="px-6 py-8">
              <p className="text-sm text-gray-500">
                Nenhum cliente cadastrado ainda. Crie clientes pela tela
                principal ao iniciar um novo processamento.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome do cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nº declarações
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Última atualização
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clients.map((client) => {
                    const stats = statsByClient[client.id] || {
                      count: 0,
                      lastUpdated: null,
                    };
                    return (
                      <tr key={client.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-medium text-gray-900">
                          {client.name}
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          {client.displayId ?? "—"}
                        </td>
                        <td className="px-6 py-3 text-right text-gray-800">
                          {stats.count}
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          {stats.lastUpdated
                            ? new Date(stats.lastUpdated).toLocaleString(
                                "pt-BR",
                                {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                }
                              )
                            : "—"}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <Link
                            href={`/clients/${encodeURIComponent(client.id)}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                          >
                            Explorar
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
