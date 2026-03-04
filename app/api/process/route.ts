import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import path from "path";
import { getSupabaseServer, STORAGE_BUCKET } from "@/lib/supabase-server";
import { fillTemplateExcel } from "@/lib/fill-template-excel";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Transaction {
  date: string;
  invoice: string;
  narrative: string;
  amount: number;
}

interface ExtractedData {
  sales: Transaction[];
  purchases: Transaction[];
}

interface Client {
  id: string;
  name: string;
  displayId?: string;
  createdAt: string;
}

interface UploadedFileRef {
  name: string;
  path: string; // relativo a output/
}

interface HistoryEntry {
  id: string;
  clientId: string;
  clientName: string;
  quarter: string;
  year: string;
  salesCount: number;
  purchasesCount: number;
  droppedCount?: number;
  fileName: string;
  downloadPath: string;
  uploadedFileNames?: string[];
  uploadedFiles?: UploadedFileRef[];
  createdAt: string;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200) || "file";
}

async function saveUploadedFilesToStorage(
  files: File[],
  procId: string
): Promise<UploadedFileRef[]> {
  const supabase = getSupabaseServer();
  const used = new Set<string>();
  const result: UploadedFileRef[] = [];

  for (const file of files) {
    let base = sanitizeFileName(file.name);
    if (!base) base = "file";
    const ext = path.extname(base) || path.extname(file.name) || "";
    const baseWithoutExt = base.slice(0, base.length - ext.length) || "file";
    let saveName = base;
    let n = 0;
    while (used.has(saveName.toLowerCase())) {
      n += 1;
      saveName = `${baseWithoutExt}_${n}${ext}`;
    }
    used.add(saveName.toLowerCase());
    const storagePath = `uploads/${procId}/${saveName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, { contentType: file.type || "application/octet-stream", upsert: true });

    if (error) throw new Error(`Falha ao enviar arquivo: ${error.message}`);

    result.push({ name: file.name, path: storagePath });
  }
  return result;
}

async function generateAndUploadExcel(
  data: ExtractedData,
  clientName: string,
  quarter: string,
  year: string
): Promise<{ downloadPath: string; fileName: string }> {
  const timestamp = Date.now();
  const safeClientName = clientName.replace(/[^a-zA-Z0-9_\-]/g, "_");
  const baseName = `${safeClientName}_${quarter}_${year}`;
  const fileName = `${baseName}_${timestamp}.xlsx`;
  const storagePath = `${baseName}/${fileName}`;

  const buffer = await fillTemplateExcel(data, clientName, quarter, year);

  const supabase = getSupabaseServer();
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      upsert: true,
    });

  if (error) throw new Error(`Falha ao salvar Excel: ${error.message}`);

  return { downloadPath: storagePath, fileName };
}

// ─── CSV helpers (para formatos conhecidos) ────────────────────────────────────

function detectDelimiter(firstLine: string): "," | "\t" {
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  if (tabCount > commaCount) {
    return "\t";
  }
  return ",";
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const stripped = text.replace(/^\uFEFF/, "").trim();
  const lines = stripped.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = lines[0].split(delimiter).map((h) => h.trim());
  const rows: string[][] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      const next = line[j + 1];
      if (ch === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (!inQuotes && ch === delimiter) {
        cells.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    if (cells.some((c) => c !== "")) {
      rows.push(cells);
    }
  }

  return { headers, rows };
}

function normalizeDate(raw: string): string | null {
  let trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.length > 10) {
    trimmed = trimmed.slice(0, 10);
  }
  const m = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (m) {
    const [_, dStr, mStr, yStr] = m;
    const d = parseInt(dStr, 10);
    const mo = parseInt(mStr, 10);
    let y = parseInt(yStr, 10);
    if (y < 100) y += 2000;
    const iso = new Date(Date.UTC(y, mo - 1, d));
    if (!isNaN(iso.getTime())) {
      return iso.toISOString().slice(0, 10);
    }
  }
  const direct = new Date(trimmed);
  if (!isNaN(direct.getTime())) {
    return direct.toISOString().slice(0, 10);
  }
  return null;
}

function parseAmount(raw: string): number {
  let value = raw.trim();
  if (!value || value === "-") return 0;

  // Trata números entre parênteses como negativos: (123.45) -> -123.45
  let sign = 1;
  if (value.startsWith("(") && value.endsWith(")")) {
    sign = -1;
    value = value.slice(1, -1).trim();
  }

  // Remove símbolo de moeda, espaços e separadores de milhar comuns
  value = value.replace(/£/g, "").replace(/\s/g, "");

  // Substitui vírgula por ponto quando usado como separador decimal
  // Ex.: 1,23 -> 1.23 ; 1,234.56 -> 1234.56 ; 1.234,56 -> 1234.56
  const commaCount = (value.match(/,/g) || []).length;
  const dotCount = (value.match(/\./g) || []).length;

  if (commaCount === 1 && dotCount === 0) {
    // Formato estilo 123,45
    value = value.replace(",", ".");
  } else if (commaCount > 1 && dotCount === 0) {
    // Vários separadores: assume vírgulas como milhar, ponto como decimal inexistente
    const parts = value.split(",");
    const decimal = parts.pop();
    value = parts.join("") + "." + decimal;
  } else if (dotCount > 1 && commaCount === 0) {
    // Pontos como milhar
    const parts = value.split(".");
    const decimal = parts.pop();
    value = parts.join("") + "." + decimal;
  } else if (commaCount === 1 && dotCount >= 1) {
    // Mistura ponto e vírgula, assume vírgula como decimal
    value = value.replace(/\./g, "").replace(",", ".");
  }

  const num = Number(value);
  if (isNaN(num)) return 0;
  return sign * num;
}

// ─── Claude extraction ────────────────────────────────────────────────────────

async function extractTransactionsWithClaude(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<ExtractedData> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `Você é um assistente contábil especializado em documentos financeiros britânicos.
Analise este documento e extraia TODAS as transações financeiras.

Retorne APENAS um JSON válido, sem texto adicional, sem blocos de código, sem explicações.

Formato exato:
{
  "sales": [
    { "date": "YYYY-MM-DD", "invoice": "código ou referência", "narrative": "descrição da transação", "amount": 0.00 }
  ],
  "purchases": [
    { "date": "YYYY-MM-DD", "invoice": "código ou referência", "narrative": "descrição da transação", "amount": 0.00 }
  ]
}

Regras:
- "sales" = receitas, entradas, faturas emitidas, pagamentos recebidos
- "purchases" = despesas, saídas, compras, pagamentos realizados
- Data: SEMPRE em YYYY-MM-DD. Extraia o dia e o mês EXATAMENTE como aparecem no documento (ex.: "05 May 2024" = 2024-05-05, "05 Jun 2024" = 2024-06-05). NÃO troque dia e mês. Só use dia 01 se a data realmente não aparecer no documento.
- Se não houver invoice/referência, use "N/A"
- amount deve ser número positivo (sem símbolo £)
- Se o documento não contiver transações financeiras, retorne {"sales": [], "purchases": []}`;

  // Prepare content based on file type
  let messageContent: Anthropic.MessageParam["content"];

  if (mimeType === "text/csv" || fileName.toLowerCase().endsWith(".csv")) {
    // Tenta primeiro um parser determinístico para CSV com colunas conhecidas
    const csvText = fileBuffer.toString("utf-8");
    const { headers, rows } = parseCsv(csvText);
    const normalizedHeaders = headers.map((h) =>
      h.toLowerCase().replace(/[^a-z0-9]/g, "")
    );

    const findHeader = (...candidates: string[]) => {
      const exact = normalizedHeaders.findIndex((h) =>
        candidates.some((c) => h === c)
      );
      if (exact !== -1) return exact;
      return normalizedHeaders.findIndex((h) =>
        candidates.some((c) => (h && c && (h.includes(c) || c.includes(h))))
      );
    };

    const idxDate = findHeader("date");
    const idxDesc = findHeader("description", "narrative", "details");
    const idxMoneyOut = findHeader("moneyout", "moneyoutgbp");
    const idxMoneyIn = findHeader("moneyin", "moneyingbp");

    const hasKnownShape =
      idxDate !== -1 && idxDesc !== -1 && idxMoneyOut !== -1 && idxMoneyIn !== -1;

    if (hasKnownShape) {
      const sales: Transaction[] = [];
      const purchases: Transaction[] = [];

      for (const row of rows) {
        const rawDate = row[idxDate] ?? "";
        const normDate = normalizeDate(rawDate);
        if (!normDate) continue;

        const desc = (row[idxDesc] ?? "").trim();
        const moneyOutRaw = parseAmount(row[idxMoneyOut] ?? "");
        const moneyInRaw = parseAmount(row[idxMoneyIn] ?? "");

        const moneyIn = moneyInRaw;
        const moneyOut = Math.abs(moneyOutRaw);

        if (moneyIn > 0) {
          sales.push({
            date: normDate,
            invoice: "N/A",
            narrative: desc || "N/A",
            amount: moneyIn,
          });
        }
        if (moneyOut > 0) {
          purchases.push({
            date: normDate,
            invoice: "N/A",
            narrative: desc || "N/A",
            amount: moneyOut,
          });
        }
      }

      return { sales, purchases };
    }

    // Se o CSV não tiver esse formato, cai de volta para IA usando texto
    messageContent = [
      {
        type: "text",
        text: `${prompt}\n\nConteúdo do arquivo CSV:\n\n${csvText}`,
      },
    ];
  } else {
    // PDF or image: send as base64
    const base64Data = fileBuffer.toString("base64");
    const mediaType =
      mimeType === "application/pdf"
        ? "application/pdf"
        : (mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp");

    if (mimeType === "application/pdf") {
      messageContent = [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64Data,
          },
        },
        { type: "text", text: prompt },
      ] as Anthropic.MessageParam["content"];
    } else {
      messageContent = [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: base64Data,
          },
        },
        { type: "text", text: prompt },
      ];
    }
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: messageContent }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as Anthropic.TextBlock).text)
    .join("");

  // Parse JSON — remove qualquer cerca de markdown e tenta auto-correção simples
  let cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  // Garante que começa em '{' e termina em '}' cortando lixo fora
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  // Remove vírgulas sobrando antes de '}' ou ']'
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

  let parsed: ExtractedData;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    // Última tentativa: corta depois do último '}' e tenta de novo
    const lb = cleaned.lastIndexOf("}");
    if (lb !== -1) {
      const truncated = cleaned.slice(0, lb + 1);
      parsed = JSON.parse(truncated);
    } else {
      throw err;
    }
  }

  // Validate structure
  if (!Array.isArray(parsed.sales) || !Array.isArray(parsed.purchases)) {
    throw new Error(`Resposta da IA inválida para o arquivo: ${fileName}`);
  }

  return parsed;
}

// ─── Merge multiple extractions ───────────────────────────────────────────────

function mergeExtractions(extractions: ExtractedData[]): ExtractedData {
  return extractions.reduce(
    (acc, curr) => ({
      sales: [...acc.sales, ...curr.sales],
      purchases: [...acc.purchases, ...curr.purchases],
    }),
    { sales: [], purchases: [] }
  );
}

// ─── UK fiscal year quarters (tax year starts 6 April) ────────────────────────

function getQuarterDates(
  quarter: string,
  fiscalYear: number
): { start: Date; end: Date } {
  switch (quarter) {
    case "Q1":
      return {
        start: new Date(fiscalYear, 3, 6), // 6 de abril
        end: new Date(fiscalYear, 6, 5), // 5 de julho
      };
    case "Q2":
      return {
        start: new Date(fiscalYear, 6, 6), // 6 de julho
        end: new Date(fiscalYear, 9, 5), // 5 de outubro
      };
    case "Q3":
      return {
        start: new Date(fiscalYear, 9, 6), // 6 de outubro
        end: new Date(fiscalYear + 1, 0, 5), // 5 de janeiro do ano seguinte
      };
    case "Q4":
      return {
        start: new Date(fiscalYear + 1, 0, 6), // 6 de janeiro do ano seguinte
        end: new Date(fiscalYear + 1, 3, 5), // 5 de abril do ano seguinte
      };
    default:
      throw new Error(`Quarter inválido: ${quarter}`);
  }
}

/**
 * Gera purchases automáticos: 10% do gross de cada mês do quarter (3 entradas, uma por mês).
 * Total = 30% do gross do trimestre. Meses sem receita não geram entrada.
 */
function generateAutoPurchases(
  sales: { date: string; amount: number }[],
  quarter: string,
  fiscalYear: number
): Transaction[] {
  const { start } = getQuarterDates(quarter, fiscalYear);
  const baseYear = start.getFullYear();
  const baseMonth = start.getMonth();

  const purchases: Transaction[] = [];

  for (let i = 0; i < 3; i++) {
    const monthIndex = baseMonth + i;
    const year = baseYear;

    const monthGross = sales
      .filter((s) => {
        const d = new Date(s.date);
        return d.getMonth() === monthIndex && d.getFullYear() === year;
      })
      .reduce((sum, s) => sum + s.amount, 0);

    const expenseAmount = Math.round(monthGross * 0.1 * 100) / 100; // 10% arredondado
    if (expenseAmount <= 0) continue;

    const lastDay = new Date(year, monthIndex + 1, 0); // último dia do mês
    const monthName = lastDay.toLocaleString("en-GB", { month: "long", year: "numeric" });

    purchases.push({
      date: lastDay.toISOString().split("T")[0],
      invoice: `EXP-${quarter}-${String(i + 1).padStart(2, "0")}`,
      narrative: `Business expenses – ${monthName}`,
      amount: expenseAmount,
    });
  }

  return purchases;
}

// ─── Main API handler ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const clientId = (formData.get("clientId") as string) || "";
    const clientNameRaw = (formData.get("clientName") as string) || "";
    const quarter = formData.get("quarter") as string;
    const year = formData.get("year") as string;
    const files = formData.getAll("files") as File[];

    let effectiveClientName = clientNameRaw.trim();
    let effectiveClientId = clientId.trim();

    if (effectiveClientId) {
      const supabase = getSupabaseServer();
      const { data: found, error } = await supabase
        .from("clients")
        .select("id, name")
        .eq("id", effectiveClientId)
        .single();

      if (error || !found) {
        return NextResponse.json(
          { error: "Cliente não encontrado. Atualize a página e tente novamente." },
          { status: 400 }
        );
      }
      effectiveClientName = found.name;
    }

    // Validate inputs
    if (!effectiveClientName) {
      return NextResponse.json(
        { error: "Nome do cliente é obrigatório." },
        { status: 400 }
      );
    }
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    console.log(
      `\n📋 Processando ${files.length} arquivo(s) para: ${effectiveClientName} — ${quarter}/${year}`
    );

    // Extract transactions from all files
    const extractions: ExtractedData[] = [];

    for (const file of files) {
      console.log(`  → Analisando: ${file.name} (${file.type})`);
      const buffer = Buffer.from(await file.arrayBuffer());
      const extraction = await extractTransactionsWithClaude(buffer, file.type, file.name);
      console.log(`     Sales: ${extraction.sales.length} | Purchases: ${extraction.purchases.length}`);
      extractions.push(extraction);
    }

    const mergedData = mergeExtractions(extractions);
    console.log(`\n✅ Total extraído — Sales: ${mergedData.sales.length} (purchases serão gerados automaticamente)`);

    // Filtra apenas sales pelo período do ano fiscal britânico (6 abr – 5 abr)
    const fiscalYear = parseInt(year, 10);
    const { start: periodStart, end: periodEnd } = getQuarterDates(quarter, fiscalYear);

    const inPeriod = (dateStr: string): boolean => {
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) && d >= periodStart && d <= periodEnd;
    };

    const filteredSales = mergedData.sales.filter((t) => inPeriod(t.date));
    const outSales = mergedData.sales.filter((t) => !inPeriod(t.date));
    const droppedCount = outSales.length;

    // Purchases automáticos: 10% do gross por mês (3 entradas = 30% do trimestre)
    const autoPurchases = generateAutoPurchases(filteredSales, quarter, fiscalYear);

    const filteredData: ExtractedData = {
      sales: filteredSales,
      purchases: autoPurchases,
    };

    // Exige ao menos uma receita no período; despesas são sempre geradas a partir delas
    if (filteredData.sales.length === 0) {
      return NextResponse.json(
        {
          error:
            "Nenhuma receita do período selecionado foi identificada nos documentos enviados. Verifique se o trimestre/ano batem com as datas do extrato ou tente outros documentos.",
        },
        { status: 400 }
      );
    }

    const procId = `proc_${Date.now()}`;

    console.log("💾 Salvando documentos no Supabase Storage...");
    const uploadedFiles = await saveUploadedFilesToStorage(files, procId);

    console.log("📊 Gerando Excel e enviando para o Storage...");
    const { downloadPath, fileName } = await generateAndUploadExcel(
      filteredData,
      effectiveClientName,
      quarter,
      year
    );

    const createdAt = new Date().toISOString();
    const historyRow = {
      id: procId,
      client_id: effectiveClientId || `name_${effectiveClientName}`,
      client_name: effectiveClientName,
      quarter,
      year,
      sales_count: filteredData.sales.length,
      purchases_count: filteredData.purchases.length,
      dropped_count: droppedCount,
      file_name: fileName,
      download_path: downloadPath,
      uploaded_file_names: files.map((f) => f.name),
      uploaded_files: uploadedFiles,
      created_at: createdAt,
    };

    const supabase = getSupabaseServer();
    const { error: insertError } = await supabase.from("history").insert(historyRow);
    if (insertError) throw new Error(insertError.message);

    console.log(`✅ Concluído! Arquivo em Storage: ${downloadPath}`);

    return NextResponse.json({
      clientId: historyRow.client_id,
      clientName: historyRow.client_name,
      quarter: historyRow.quarter,
      year: historyRow.year,
      salesCount: historyRow.sales_count,
      purchasesCount: historyRow.purchases_count,
      droppedCount: historyRow.dropped_count,
      fileName: historyRow.file_name,
      downloadPath: historyRow.download_path,
      createdAt: historyRow.created_at,
      purchasesMode: "auto",
    });
  } catch (err: unknown) {
    console.error("❌ Erro no processamento:", err);
    const message = err instanceof Error ? err.message : "Erro interno do servidor.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
