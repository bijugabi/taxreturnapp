"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "same-origin",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((data as { error?: string }).error || "Usuário ou senha incorretos.");
        setLoading(false);
        return;
      }

      const from = searchParams.get("from");
      const redirect = from && from.startsWith("/") && !from.startsWith("//") ? from : "/";
      window.location.href = redirect;
    } catch {
      setError("Erro ao conectar. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm bg-white border border-[var(--border)] rounded-lg p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Tax Return <span className="text-[var(--accent)]">·</span> MTD
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Making Tax Digital
        </p>
      </div>

      <h2 className="text-sm font-medium text-[var(--text-primary)] mb-4">
        Acesso restrito
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Usuário
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            disabled={loading}
            className="w-full bg-white border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-150 disabled:bg-[var(--bg-subtle)] disabled:text-[var(--text-disabled)]"
            placeholder="Usuário"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            disabled={loading}
            className="w-full bg-white border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all duration-150 disabled:bg-[var(--bg-subtle)] disabled:text-[var(--text-disabled)]"
            placeholder="Senha"
          />
        </div>

        {error && (
          <p className="text-sm text-[var(--error)] bg-[var(--error-light)] border border-[var(--error)]/20 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium px-4 py-2 rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="w-full max-w-sm bg-white border border-[var(--border)] rounded-lg p-6 animate-pulse">
      <div className="mb-6 h-8 bg-[var(--bg-subtle)] rounded" />
      <div className="h-4 w-24 bg-[var(--bg-subtle)] rounded mb-4" />
      <div className="space-y-4">
        <div className="h-10 bg-[var(--bg-subtle)] rounded-md" />
        <div className="h-10 bg-[var(--bg-subtle)] rounded-md" />
        <div className="h-10 bg-[var(--bg-subtle)] rounded-md" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-6">
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
