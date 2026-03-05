# Deploy no Railway com Supabase — Tax Return App

O app está preparado para rodar no **Railway** com dados (clientes, histórico e arquivos) no **Supabase**.

---

## 1. Supabase

### 1.1 Criar projeto

1. Acesse [supabase.com](https://supabase.com) e crie um projeto.
2. No **SQL Editor**, execute o conteúdo do arquivo **`supabase/schema.sql`** (cria as tabelas `clients`, `history` e `admin_users`).

### 1.2 Storage

1. No menu **Storage**, crie um bucket:
   - **Nome:** `tax-return-files`
   - **Public:** desmarcado (acesso só via API com service role).
2. Em **Policies** do bucket, crie uma policy que permita ao **service_role** fazer SELECT, INSERT, UPDATE e DELETE (ou deixe sem policy e teste — a service_role costuma ignorar RLS).

### 1.3 Variáveis

No painel do Supabase, em **Settings → API**:

- **Project URL** → use como `NEXT_PUBLIC_SUPABASE_URL`
- **service_role** (secret) → use como `SUPABASE_SERVICE_ROLE_KEY` (nunca exponha no front-end)

---

## 2. Railway

### 2.1 Pré-requisitos

- Conta no [Railway](https://railway.app).
- Repositório do projeto no **GitHub** (o Railway faz deploy a partir do GitHub).

### 2.2 Criar o projeto e conectar o repositório

1. Acesse [railway.app](https://railway.app) e faça login (pode ser com GitHub).
2. Clique em **New Project**.
3. Escolha **Deploy from GitHub repo**.
4. Autorize o Railway a acessar sua conta GitHub (se pedir) e selecione o repositório **taxreturnapp** (ou o nome do seu repo).
5. O Railway detecta que é um app **Node.js** e usa automaticamente:
   - **Build:** `npm install` e `npm run build`
   - **Start:** `npm run start` (do seu `package.json`)

Não é necessário **Procfile** no Railway; o `package.json` já define os scripts.

### 2.3 Variáveis de ambiente

No projeto do Railway:

1. Clique no **serviço** (o retângulo do seu app).
2. Aba **Variables** (ou **Settings → Variables**).
3. Clique em **+ New Variable** ou **Add Variable** e cadastre:

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `ANTHROPIC_API_KEY` | Sim | Chave da API Anthropic (Claude). |
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do projeto Supabase (Settings → API). |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Chave **service_role** do Supabase (Settings → API). |
| `AUTH_SECRET` | Sim | String secreta para assinatura da sessão de login (ex.: `openssl rand -hex 32`). |

**Importante:** variáveis que começam com `NEXT_PUBLIC_` precisam existir no momento do build.

### Criar o primeiro utilizador admin (login)

Depois de executar o `schema.sql` no Supabase, crie o primeiro utilizador na tabela `admin_users`:

1. Localmente, com `.env` ou `.env.local` configurado (com `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`), execute:
   ```bash
   npm run seed:admin
   ```
   Isto cria o utilizador **admin** com password **admin**. Para outro utilizador/password:
   ```bash
   node scripts/seed-admin.js meuuser minhasenha
   ```
2. Em produção, altere a password depois do primeiro login (execute novamente o seed com o novo username/password ou insira manualmente no Supabase). No Railway elas já ficam disponíveis no build se você as definir nas Variables do serviço.

### 2.4 Domínio e deploy

1. Na aba **Settings** do serviço, em **Networking**, clique em **Generate Domain** (ou **Public Networking**) para o Railway gerar uma URL pública (ex: `seu-app.up.railway.app`).
2. A cada **push** no branch conectado (geralmente `main`), o Railway refaz o build e o deploy automaticamente.

### 2.5 Template Excel

O arquivo **`public/template.xlsx`** precisa estar no repositório. O Excel é gerado em Node com **ExcelJS**; o script Python não é usado em produção.

---

## 3. Checklist antes do deploy

- [ ] Executou **`supabase/schema.sql`** no Supabase (tabelas `clients`, `history`, `admin_users`).
- [ ] Executou **`npm run seed:admin`** (com Supabase configurado) para criar o primeiro utilizador de login.
- [ ] Criou o bucket **`tax-return-files`** no Storage do Supabase.
- [ ] Repositório do projeto está no **GitHub** e conectado ao Railway.
- [ ] Configurou no Railway: `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_SECRET`.
- [ ] O arquivo **`public/template.xlsx`** está no repositório.
- [ ] Rodou **`npm run build`** localmente e corrigiu erros (e, se quiser testar com Supabase, use **`.env.example`** como base para um `.env.local`).

---

## 4. Resumo da stack (Railway + Supabase)

| Camada | Tecnologia |
|--------|------------|
| Hospedagem | Railway (Node.js) |
| Banco + Storage | Supabase (PostgreSQL + Storage) |
| Geração de Excel | ExcelJS (Node), sem Python |
| Variáveis | Railway Variables |
| Deploy | GitHub → Railway (deploy automático a cada push) |

Depois do primeiro deploy, o app usa apenas Supabase para clientes, histórico e arquivos (uploads e Excels gerados).
