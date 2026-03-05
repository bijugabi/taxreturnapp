-- Tax Return App — schema para Supabase
-- Execute no SQL Editor do painel Supabase (https://supabase.com/dashboard)

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de histórico de processamentos
CREATE TABLE IF NOT EXISTS history (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  quarter TEXT NOT NULL,
  year TEXT NOT NULL,
  sales_count INTEGER NOT NULL,
  purchases_count INTEGER NOT NULL,
  dropped_count INTEGER,
  file_name TEXT NOT NULL,
  download_path TEXT NOT NULL,
  uploaded_file_names TEXT[],
  uploaded_files JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas comuns
CREATE INDEX IF NOT EXISTS idx_history_client_id ON history(client_id);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON history(created_at DESC);

-- Tabela de utilizadores admin (login)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

-- Para criar o primeiro utilizador, execute o script: node scripts/seed-admin.js
-- (com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env)

-- Storage: crie um bucket no painel Supabase (Storage → New bucket):
-- Nome: tax-return-files
-- Public: No (acesso apenas via API com service role)
-- Em Policies, use "Allow all" para service role ou crie uma policy que permita
--   SELECT, INSERT, UPDATE, DELETE para authenticated/service role no bucket.
