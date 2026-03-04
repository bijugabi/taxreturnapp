"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type Quarter = "Q1" | "Q2" | "Q3" | "Q4";
type Status = "idle" | "loading" | "success" | "error";

interface Client {
  id: string;
  name: string;
  displayId?: string;
}

interface Result {
  clientId: string;
  clientName: string;
  quarter: Quarter;
  year: string;
  salesCount: number;
  purchasesCount: number;
  droppedCount?: number;
  fileName: string;
  downloadPath: string;
  createdAt: string;
  purchasesMode?: "auto";
}

const QUARTER_LABELS: Record<Quarter, string> = {
  Q1: "Q1 (6 Abr – 5 Jul)",
  Q2: "Q2 (6 Jul – 5 Out)",
  Q3: "Q3 (6 Out – 5 Jan)",
  Q4: "Q4 (6 Jan – 5 Abr)",
};

/** Ano fiscal = ano em que o tax year começa (ex: 2025 = tax year 2025/26). */
function getCurrentQuarter(): { quarter: Quarter; fiscalYear: number } {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  const day = today.getDate();

  if ((month === 0 && day >= 6) || month === 1 || month === 2 || (month === 3 && day < 6)) {
    return { quarter: "Q4", fiscalYear: year - 1 };
  }
  if ((month === 3 && day >= 6) || month === 4 || month === 5 || (month === 6 && day < 6)) {
    return { quarter: "Q1", fiscalYear: year };
  }
  if ((month === 6 && day >= 6) || month === 7 || month === 8 || (month === 9 && day < 6)) {
    return { quarter: "Q2", fiscalYear: year };
  }
  if ((month === 9 && day >= 6) || month === 10 || month === 11) {
    return { quarter: "Q3", fiscalYear: year };
  }
  // 1 Jan – 5 Jan: ainda Q3 do ano fiscal anterior
  return { quarter: "Q3", fiscalYear: year - 1 };
}

const QUARTER_ORDER: Record<Quarter, number> = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };

export default function UploadForm() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientDisplayId, setNewClientDisplayId] = useState("");
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [quarter, setQuarter] = useState<Quarter>("Q1");
  const [year, setYear] = useState("");
  const [yearOptions, setYearOptions] = useState<number[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [progressMsg, setProgressMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load clients on mount
  useEffect(() => {
    const loadClients = async () => {
      try {
        const res = await fetch("/api/clients");
        if (!res.ok) return;
        const data: Client[] = await res.json();
        setClients(data);
        if (data.length > 0) {
          setSelectedClientId(data[0].id);
        }
      } catch {
        // ignore for now
      }
    };
    loadClients();

    // Opções de ano fiscal (ano em que o tax year começa): 2020 até ano fiscal atual
    const { fiscalYear: currentFiscalYear, quarter: currentQuarter } = getCurrentQuarter();
    const years: number[] = [];
    for (let y = currentFiscalYear; y >= 2020; y--) {
      years.push(y);
    }
    setYearOptions(years);
    setYear(String(currentFiscalYear));
    setQuarter(currentQuarter);
  }, []);

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const allowed = ["application/pdf", "text/csv", "image/jpeg", "image/png", "image/jpg"];
    const valid = Array.from(newFiles).filter((f) => allowed.includes(f.type));
    const invalid = Array.from(newFiles).filter((f) => !allowed.includes(f.type));
    if (invalid.length > 0) {
      alert(`Arquivo(s) não suportado(s): ${invalid.map((f) => f.name).join(", ")}\n\nAceito: PDF, CSV, JPG, PNG`);
    }
    setFiles((prev) => {
      const existing = prev.map((f) => f.name);
      const toAdd = valid.filter((f) => !existing.includes(f.name));
      return [...prev, ...toAdd];
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type === "application/pdf") return "📄";
    if (type === "text/csv") return "📊";
    return "🖼️";
  };

  const handleSubmit = async () => {
    if (!selectedClientId.trim()) {
      alert("Por favor, selecione um cliente.");
      return;
    }
    if (files.length === 0) {
      alert("Por favor, faça upload de ao menos um documento.");
      return;
    }

    // Valida se ano fiscal/trimestre não são do futuro (ano fiscal UK: começa 6 abr)
    const { fiscalYear: currentFiscalYear, quarter: currentQuarter } = getCurrentQuarter();
    const selectedFiscalYear = parseInt(year, 10);

    const isFuture =
      selectedFiscalYear > currentFiscalYear ||
      (selectedFiscalYear === currentFiscalYear && QUARTER_ORDER[quarter] > QUARTER_ORDER[currentQuarter]);

    if (isFuture) {
      alert("Não é possível criar declarações para trimestres/anos futuros.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");
    setResult(null);
    setProgressMsg("Enviando documentos...");

    try {
      const formData = new FormData();
      formData.append("clientId", selectedClientId);
      formData.append("quarter", quarter);
      formData.append("year", year);
      files.forEach((file) => formData.append("files", file));

      setProgressMsg("Analisando documentos com IA...");
      const response = await fetch("/api/process", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar os documentos.");
      }

      setProgressMsg("Gerando arquivo Excel para download...");
      setResult(data);
      setStatus("success");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Erro desconhecido.");
      setStatus("error");
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
    setFiles([]);
    setProgressMsg("");
  };

  return (
    <div className="space-y-6">
      {/* Form card */}
      {status !== "success" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-800">Novo processamento</h2>

          {/* Client selection / creation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Cliente <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingClient((prev) => !prev)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                disabled={status === "loading"}
              >
                {isCreatingClient ? "Cancelar novo cliente" : "Novo cliente"}
              </button>
            </div>

            {!isCreatingClient && (
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                disabled={status === "loading" || clients.length === 0}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 bg-white"
              >
                {clients.length === 0 ? (
                  <option value="">Nenhum cliente cadastrado — crie um novo</option>
                ) : (
                  <>
                    <option value="">Selecione um cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.displayId ? `${c.displayId} — ${c.name}` : c.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            )}

            {isCreatingClient && (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Nome do cliente
                  </label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Ex: João Silva"
                    disabled={status === "loading"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    ID do cliente (opcional)
                  </label>
                  <input
                    type="text"
                    value={newClientDisplayId}
                    onChange={(e) => setNewClientDisplayId(e.target.value)}
                    placeholder="Ex: JS001"
                    disabled={status === "loading"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
                <div className="flex items-end justify-end">
                  <button
                    type="button"
                    disabled={status === "loading"}
                    onClick={async () => {
                      if (!newClientName.trim()) {
                        alert("Informe o nome do novo cliente.");
                        return;
                      }
                      try {
                        const res = await fetch("/api/clients", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            name: newClientName.trim(),
                            displayId: newClientDisplayId.trim() || undefined,
                          }),
                        });
                        const data: Client | { error?: string } = await res.json();
                        if (!res.ok || "error" in data) {
                          alert(
                            ("error" in data && data.error) ||
                              "Não foi possível criar o cliente."
                          );
                          return;
                        }
                        const client = data as Client;
                        setClients((prev) => [...prev, client]);
                        setSelectedClientId(client.id);
                        setNewClientName("");
                        setNewClientDisplayId("");
                        setIsCreatingClient(false);
                      } catch {
                        alert("Erro ao criar cliente. Tente novamente.");
                      }
                    }}
                    className="px-3 py-2 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400"
                  >
                    Salvar cliente
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quarter and Year */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Trimestre <span className="text-red-500">*</span>
              </label>
              <select
                value={quarter}
                onChange={(e) => setQuarter(e.target.value as Quarter)}
                disabled={status === "loading"}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 bg-white"
              >
                {(Object.keys(QUARTER_LABELS) as Quarter[]).map((q) => (
                  <option key={q} value={q}>{QUARTER_LABELS[q]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ano fiscal <span className="text-red-500">*</span>
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={status === "loading" || yearOptions.length === 0}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 bg-white"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* File upload area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Documentos <span className="text-red-500">*</span>
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
                ${isDragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}
                ${status === "loading" ? "pointer-events-none opacity-50" : ""}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.csv,.jpg,.jpeg,.png"
                onChange={(e) => addFiles(e.target.files)}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-2">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {isDragging ? "Solte os arquivos aqui" : "Arraste arquivos ou clique para selecionar"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">PDF, CSV, JPG ou PNG</p>
                </div>
              </div>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {files.map((file, i) => (
                  <li key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base">{getFileIcon(file.type)}</span>
                      <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">{formatFileSize(file.size)}</span>
                    </div>
                    {status !== "loading" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                        className="ml-2 text-gray-400 hover:text-red-500 flex-shrink-0 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Error message */}
          {status === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              <p className="font-medium">Erro ao processar</p>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={status === "loading"}
            className={`
              w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all
              ${status === "loading"
                ? "bg-blue-400 text-white cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"}
            `}
          >
            {status === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {progressMsg}
              </span>
            ) : (
              "Processar Documentos"
            )}
          </button>
        </div>
      )}

      {/* Success state */}
      {status === "success" && result && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Processado com sucesso!</h3>
              <p className="text-sm text-gray-500">Excel gerado. Baixe o arquivo abaixo.</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm mb-5">
            <div className="flex justify-between">
              <span className="text-gray-500">Cliente</span>
              <span className="font-medium text-gray-800">{result.clientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Período</span>
              <span className="font-medium text-gray-800">
                {result.quarter} / {result.year}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Receitas extraídas</span>
              <span className="font-medium text-green-700">
                {result.salesCount} lançamento{result.salesCount !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">
                {result.purchasesMode === "auto" ? "Despesas (automáticas)" : "Despesas extraídas"}
              </span>
              <span className="font-medium text-green-700">
                {result.purchasesCount} lançamento{result.purchasesCount !== 1 ? "s" : ""}
              </span>
            </div>
            {result.purchasesMode === "auto" && (
              <p className="text-sm text-amber-600 mt-1">
                ⚠️ Purchases gerados automaticamente (10% por mês do gross). Edite o Excel se necessário antes de submeter.
              </p>
            )}
            {typeof result.droppedCount === "number" && result.droppedCount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Não processadas (fora do período)</span>
                <span className="font-medium text-red-700">
                  {result.droppedCount} lançamento{result.droppedCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Arquivo</span>
              <span className="font-medium text-gray-800 text-right break-all">{result.fileName}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`/api/download?path=${encodeURIComponent(result.downloadPath)}`}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors text-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Baixar Excel
            </a>
            <a
              href="/clients"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors text-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M6 12h12M9 17h6" />
              </svg>
              Consultar histórico
            </a>
            <button
              onClick={handleReset}
              className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Novo processamento
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
