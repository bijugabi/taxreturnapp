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
      <main className="min-h-screen bg-[var(--bg-base)]">
        <nav className="border-b border-[var(--border)] bg-white">
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <a href="/" className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors">
              Voltar para processamento
            </a>
          </div>
        </nav>
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="bg-[var(--warning-light)] border border-amber-200 rounded-lg p-5">
            <h2 className="text-base font-semibold text-[var(--warning)] mb-2">
              Erro ao carregar clientes
            </h2>
            <p className="text-sm text-[var(--warning)] mb-2">
              Não foi possível conectar ao Supabase. Verifique:
            </p>
            <ul className="list-disc list-inside text-sm text-[var(--warning)] space-y-1">
              <li>Variáveis <code className="bg-amber-100/50 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> e <code className="bg-amber-100/50 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> no Railway</li>
              <li>Se o arquivo <code className="bg-amber-100/50 px-1 rounded">supabase/schema.sql</code> foi executado no SQL Editor do Supabase (tabelas <code className="bg-amber-100/50 px-1 rounded">clients</code> e <code className="bg-amber-100/50 px-1 rounded">history</code>)</li>
            </ul>
            <p className="text-xs text-[var(--text-secondary)] mt-3">
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
    <main className="min-h-screen bg-[var(--bg-base)]">
      <nav className="border-b border-[var(--border)] bg-white">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
              Tax Return <span className="text-[var(--accent)]">·</span> MTD
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[var(--text-secondary)]">
            <a href="/" className="hover:text-[var(--text-primary)] transition-colors">
              Processar
            </a>
            <a href="/clients" className="hover:text-[var(--text-primary)] transition-colors font-medium">
              Clientes
            </a>
            <a
              href="/api/auth/logout"
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              Sair
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Clientes
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {clients.length} cliente{clients.length !== 1 ? "s" : ""} registrado{clients.length !== 1 ? "s" : ""}
          </p>
        </div>

        <section className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h2 className="text-sm font-medium text-[var(--text-primary)]">
              Lista de clientes
            </h2>
          </div>

          {clients.length === 0 ? (
            <div className="px-5 py-8">
              <p className="text-sm text-[var(--text-secondary)]">
                Nenhum cliente cadastrado ainda. Crie clientes pela tela
                principal ao iniciar um novo processamento.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider py-2 px-4">
                      Nome do cliente
                    </th>
                    <th className="text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider py-2 px-4">
                      ID
                    </th>
                    <th className="text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider py-2 px-4">
                      Nº declarações
                    </th>
                    <th className="text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider py-2 px-4">
                      Última atualização
                    </th>
                    <th className="text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider py-2 px-4">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => {
                    const stats = statsByClient[client.id] || {
                      count: 0,
                      lastUpdated: null,
                    };
                    return (
                      <tr
                        key={client.id}
                        className="border-b border-[var(--bg-subtle)] hover:bg-[var(--bg-base)] transition-colors duration-100"
                      >
                        <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
                          {client.name}
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)]">
                          {client.displayId ?? "—"}
                        </td>
                        <td className="py-3 px-4 text-right text-[var(--text-primary)]">
                          {stats.count}
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)]">
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
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/clients/${encodeURIComponent(client.id)}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors duration-150"
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
