import UploadForm from "./components/UploadForm";

const MTD_DEADLINES = [
  { quarter: "Q1", period: "6 Abr – 5 Jul", deadline: "31 Jul" },
  { quarter: "Q2", period: "6 Jul – 5 Out", deadline: "31 Out" },
  { quarter: "Q3", period: "6 Out – 5 Jan", deadline: "31 Jan" },
  { quarter: "Q4", period: "6 Jan – 5 Abr", deadline: "30 Abr" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Tax Return at Scale</h1>
              <p className="text-xs text-gray-500">Making Tax Digital — MTD</p>
            </div>
          </div>
          <a
            href="/clients"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-100 rounded-lg px-3 py-1.5 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            Ver clientes & histórico
          </a>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Quarter info banner — ano fiscal UK (6 abr – 5 abr) */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div className="text-sm">
            <p className="font-medium text-blue-800">Prazos MTD (ano fiscal UK)</p>
            <p className="text-blue-600 mt-0.5">
              {MTD_DEADLINES.map(({ quarter, period, deadline }) => `${quarter} ${period} → ${deadline}`).join(" · ")}
            </p>
          </div>
        </div>

        <UploadForm />
      </div>
    </main>
  );
}
