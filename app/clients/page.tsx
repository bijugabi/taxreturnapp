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
  const supabase = getSupabaseServer();

  const { data: clientsData } = await supabase
    .from("clients")
    .select("id, name, display_id, created_at")
    .order("name");

  const { data: historyData } = await supabase
    .from("history")
    .select("client_id, created_at")
    .order("created_at", { ascending: false });

  const clients: Client[] = (clientsData || []).map((r) => ({
    id: r.id,
    name: r.name,
    displayId: r.display_id ?? undefined,
    createdAt: r.created_at,
  }));

  const history = (historyData || []) as HistoryRow[];

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
