"use client";

import { useEffect, useRef, useState } from "react";

interface UploadedFileRef {
  name: string;
  path: string;
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
  uploadedFiles?: UploadedFileRef[];
  createdAt: string;
}

interface Props {
  entries: HistoryEntry[];
}

function getQuarterKey(quarter: string, year: string) {
  return `${quarter}_${year}`;
}

export default function ClientHistory({ entries }: Props) {
  const [items, setItems] = useState<HistoryEntry[]>(entries);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<HistoryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const byQuarter: Record<string, HistoryEntry[]> = {};
  for (const e of items) {
    const key = getQuarterKey(e.quarter, e.year);
    if (!byQuarter[key]) byQuarter[key] = [];
    byQuarter[key].push(e);
  }
  const quarterKeys = Object.keys(byQuarter).sort((a, b) => {
    const [qA, yA] = a.split("_");
    const [qB, yB] = b.split("_");
    const yearA = parseInt(yA, 10);
    const yearB = parseInt(yB, 10);
    if (yearA !== yearB) return yearB - yearA;
    const qNum = (q: string) => parseInt(q.replace("Q", ""), 10);
    return qNum(qB) - qNum(qA);
  });

  const handleRequestDelete = (entry: HistoryEntry) => {
    setDeleting(entry);
    setModalOpen(true);
  };

  const handleDownloadExcel = (entry: HistoryEntry) => {
    window.location.href = `/api/download?path=${encodeURIComponent(
      entry.downloadPath
    )}`;
  };

  const handleDownloadDocuments = (entry: HistoryEntry) => {
    if (!entry.uploadedFiles || entry.uploadedFiles.length === 0) {
      alert("Não há documentos salvos para esta declaração.");
      return;
    }
    entry.uploadedFiles.forEach((f) => {
      const url = `/api/download?path=${encodeURIComponent(
        f.path
      )}&name=${encodeURIComponent(f.name)}`;
      window.open(url, "_blank");
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/history?id=${encodeURIComponent(deleting.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = (data as any).error || "Não foi possível excluir a declaração.";
        alert(msg);
        setLoading(false);
        return;
      }
      setItems((prev) => prev.filter((e) => e.id !== deleting.id));
      setModalOpen(false);
      setDeleting(null);
    } catch {
      alert("Erro ao excluir declaração. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setModalOpen(false);
    setDeleting(null);
  };

  // Fecha o menu de opções ao clicar fora
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      const target = event.target as Node | null;
      if (target && !containerRef.current.contains(target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-500">
          Nenhuma declaração processada ainda para este cliente.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <div className="space-y-8">
        {quarterKeys.map((key) => {
          const [quarter, year] = key.split("_");
          const list = byQuarter[key];
          return (
            <section
              key={key}
              className="bg-white rounded-xl border border-gray-200 shadow-sm"
            >
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-800">
                  {quarter} / {year}
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {list.map((entry) => (
                  <div
                    key={entry.id}
                    className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-sm">
                      <div>
                        <span className="text-gray-500">Receitas</span>
                        <p className="font-medium text-green-700">
                          {entry.salesCount}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Despesas</span>
                        <p className="font-medium text-green-700">
                          {entry.purchasesCount}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Gerado em</span>
                        <p className="font-medium text-gray-800">
                          {new Date(entry.createdAt).toLocaleString("pt-BR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-gray-500">Documentos enviados</span>
                        {entry.uploadedFiles && entry.uploadedFiles.length > 0 ? (
                          <p className="mt-0.5 text-xs text-gray-700">
                            {entry.uploadedFiles.length} documento
                            {entry.uploadedFiles.length !== 1 ? "s" : ""}
                          </p>
                        ) : entry.uploadedFileNames &&
                          entry.uploadedFileNames.length > 0 ? (
                          <p className="mt-0.5 text-xs text-gray-500">
                            {entry.uploadedFileNames.length} documento
                            {entry.uploadedFileNames.length !== 1 ? "s" : ""}{" "}
                            (processamentos antigos, sem download salvo)
                          </p>
                        ) : (
                          <p className="text-gray-400 text-xs mt-0.5">—</p>
                        )}
                      </div>
                    </div>
                    <div className="relative flex-shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuId((prev) =>
                            prev === entry.id ? null : entry.id
                          )
                        }
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                      >
                        <span className="sr-only">Abrir opções</span>
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                          aria-hidden="true"
                        >
                          <path d="M3 8a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm4.5 0A1.5 1.5 0 119 8 1.5 1.5 0 017.5 8zm4.5 0A1.5 1.5 0 1115 8a1.5 1.5 0 01-3 0z" />
                        </svg>
                      </button>

                      {openMenuId === entry.id && (
                        <div className="absolute right-0 mt-2 w-44 rounded-lg bg-white border border-gray-200 shadow-lg z-20">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              handleDownloadExcel(entry);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            Baixar declaração
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              handleDownloadDocuments(entry);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            Baixar documentos
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              handleRequestDelete(entry);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-red-700 hover:bg-red-50 border-t border-gray-100"
                          >
                            Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {modalOpen && deleting && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full mx-4 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Excluir declaração
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Tem certeza de que deseja excluir esta declaração? Isso removerá o
              arquivo Excel gerado e os documentos salvos deste histórico. Os
              arquivos originais fora do sistema não serão afetados.
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Período:{" "}
              <span className="font-medium">
                {deleting.quarter} / {deleting.year}
              </span>
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400"
              >
                {loading ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

