import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";

const SALES_START_ROW = 5;
const SALES_SUM_ROW = 15;
const PURCHASES_START_ROW = 5;
const PURCHASES_SUM_ROW = 9;
const DATA_COL_START = 2; // coluna B

export interface TransactionRow {
  date: string;
  invoice: string;
  narrative: string;
  amount: number;
}

export interface TemplateData {
  sales: TransactionRow[];
  purchases: TransactionRow[];
}

/**
 * Preenche o template Excel (MTD) com sales e purchases.
 * Retorna o buffer do arquivo gerado (para upload no Supabase Storage).
 */
export async function fillTemplateExcel(
  data: TemplateData,
  _clientName: string,
  quarter: string,
  _year: string
): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), "public", "template.xlsx");
  if (!fs.existsSync(templatePath)) {
    throw new Error(
      "template.xlsx não encontrado em /public. Coloque o template oficial na pasta public do projeto."
    );
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);

  const sales = data.sales || [];
  const purchases = data.purchases || [];

  let salesTotalRow = SALES_SUM_ROW;
  let purchasesTotalRow = PURCHASES_SUM_ROW;

  // ─── Aba Sales ─────────────────────────────────────────────────────────
  const wsSales = workbook.getWorksheet("Sales");
  if (wsSales) {
    const salesEndRow = SALES_START_ROW + Math.max(sales.length, 1) - 1;
    if (salesEndRow >= SALES_SUM_ROW) {
      const extraRows = salesEndRow - (SALES_SUM_ROW - 1);
      wsSales.spliceRows(SALES_SUM_ROW, 0, ...Array(extraRows).fill(null).map(() => []));
      salesTotalRow = SALES_SUM_ROW + extraRows;
    }
    fillSheet(wsSales, sales, SALES_START_ROW);
    const sumRow = wsSales.getRow(salesTotalRow);
    sumRow.getCell(5).value = {
      formula: `SUM(E${SALES_START_ROW}:E${salesEndRow})`,
    };
  }

  // ─── Aba Purchases ──────────────────────────────────────────────────────
  const wsPurchases = workbook.getWorksheet("Purchases");
  if (wsPurchases) {
    const purchasesEndRow = PURCHASES_START_ROW + Math.max(purchases.length, 1) - 1;
    if (purchasesEndRow >= PURCHASES_SUM_ROW) {
      const extraRows = purchasesEndRow - (PURCHASES_SUM_ROW - 1);
      wsPurchases.spliceRows(PURCHASES_SUM_ROW, 0, ...Array(extraRows).fill(null).map(() => []));
      purchasesTotalRow = PURCHASES_SUM_ROW + extraRows;
    }
    fillSheet(wsPurchases, purchases, PURCHASES_START_ROW);
    const sumRow = wsPurchases.getRow(purchasesTotalRow);
    sumRow.getCell(5).value = {
      formula: `SUM(E${PURCHASES_START_ROW}:E${purchasesEndRow})`,
    };
  }

  // ─── Atualiza referências às fórmulas de total em todas as abas ─────────
  const profitFormula = `=E${salesTotalRow}-'Purchases'!E${purchasesTotalRow}`;
  workbook.eachSheet((ws) => {
    ws.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        const v = cell.value;
        if (v && typeof v === "object" && "formula" in v) {
          let formula = (v as { formula: string }).formula;
          if (typeof formula === "string") {
            formula = formula.replace(/'Sales'!E15/g, `'Sales'!E${salesTotalRow}`);
            formula = formula.replace(/Sales!E15/g, `Sales!E${salesTotalRow}`);
            formula = formula.replace(/'Purchases'!E9/g, `'Purchases'!E${purchasesTotalRow}`);
            formula = formula.replace(/Purchases!E9/g, `Purchases!E${purchasesTotalRow}`);
            if (ws.name === "Sales") {
              formula = formula.replace(/\bE15\b/g, `E${salesTotalRow}`);
              formula = formula.replace(/=SUM\(E18:E21\)/g, profitFormula);
              formula = formula.replace(/=E18-E21/g, profitFormula);
              formula = formula.replace(/=E18-'Purchases'!E9/g, profitFormula);
            } else if (ws.name === "Purchases") {
              formula = formula.replace(/\bE9\b/g, `E${purchasesTotalRow}`);
            }
            cell.value = { formula };
          }
        }
      });
    });
  });

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(buf) ? buf : Buffer.from(buf as ArrayBuffer);
}

function fillSheet(
  worksheet: ExcelJS.Worksheet,
  transactions: TransactionRow[],
  startRow: number
) {
  transactions.forEach((txn, i) => {
    const row = worksheet.getRow(startRow + i);
    const dateStr = txn.date || "";
    const dateValue = dateStr.match(/^\d{4}-\d{2}-\d{2}$/)
      ? new Date(dateStr + "T12:00:00Z")
      : dateStr;
    row.getCell(DATA_COL_START).value = dateValue;
    row.getCell(DATA_COL_START).numFmt = "DD/MM/YYYY";
    row.getCell(DATA_COL_START + 1).value = txn.invoice || "N/A";
    row.getCell(DATA_COL_START + 2).value = txn.narrative || "";
    row.getCell(DATA_COL_START + 3).value = typeof txn.amount === "number" ? txn.amount : 0;
  });
}
