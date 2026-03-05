import UploadForm from "./components/UploadForm";

const MTD_DEADLINES = [
  { quarter: "Q1", period: "6 Abr – 5 Jul", deadline: "31 Jul" },
  { quarter: "Q2", period: "6 Jul – 5 Out", deadline: "31 Out" },
  { quarter: "Q3", period: "6 Out – 5 Jan", deadline: "31 Jan" },
  { quarter: "Q4", period: "6 Jan – 5 Abr", deadline: "30 Abr" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Banner de prazos MTD */}
      <div className="bg-[#1A1A18] text-white text-xs py-2 px-6 flex items-center justify-center gap-6 flex-wrap">
        {MTD_DEADLINES.map((q) => (
          <span key={q.quarter} className="flex items-center gap-2">
            <span className="font-mono text-[#6B6B63]">{q.quarter}</span>
            <span>{q.period}</span>
            <span className="text-[#1A7A4A] font-medium">→ {q.deadline}</span>
          </span>
        ))}
      </div>

      {/* Navbar */}
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
            <a href="/clients" className="hover:text-[var(--text-primary)] transition-colors">
              Clientes
            </a>
            <a
              href="/api/auth/logout"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Sair
            </a>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Processar documentos
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Upload de PDF, CSV ou imagens para gerar declarações MTD
          </p>
        </div>
        <UploadForm />
      </main>
    </div>
  );
}
