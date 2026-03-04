# Deploy no Heroku com Supabase — Tax Return App

O app está preparado para rodar no **Heroku** com dados (clientes, histórico e arquivos) no **Supabase**.

---

## 1. Supabase

### 1.1 Criar projeto

1. Acesse [supabase.com](https://supabase.com) e crie um projeto.
2. No **SQL Editor**, execute o conteúdo do arquivo **`supabase/schema.sql`** (cria as tabelas `clients` e `history`).

### 1.2 Storage

1. No menu **Storage**, crie um bucket:
   - **Nome:** `tax-return-files`
   - **Public:** desmarcado (acesso só via API com service role).
2. Em **Policies** do bucket, crie uma policy que permita ao **service_role** fazer SELECT, INSERT, UPDATE e DELETE (ou use “Allow all” para service role, conforme a interface do Supabase).

### 1.3 Variáveis

No painel do Supabase, em **Settings → API**:

- **Project URL** → use como `NEXT_PUBLIC_SUPABASE_URL`
- **service_role** (secret) → use como `SUPABASE_SERVICE_ROLE_KEY` (nunca exponha no front-end)

---

## 2. Heroku

### 2.1 Pré-requisitos

- Conta no Heroku e [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) instalada.
- Repositório Git do projeto (o Heroku faz deploy a partir do Git).

### 2.2 Criar o app

```bash
heroku create nome-do-seu-app
# ou deixe o Heroku gerar um nome: heroku create
```

### 2.3 Variáveis de ambiente

No Heroku, configure (Settings → Reveal Config Vars ou via CLI):

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `ANTHROPIC_API_KEY` | Sim | Chave da API Anthropic (Claude). |
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do projeto Supabase (Settings → API). |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Chave **service_role** do Supabase (Settings → API). |

Exemplo via CLI:

```bash
heroku config:set ANTHROPIC_API_KEY=sk-ant-...
heroku config:set NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
heroku config:set SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 2.4 Deploy

O repositório já inclui **Procfile** (`web: npm run start`). O build do Heroku usa Node (não é necessário Python).

```bash
git add .
git commit -m "Deploy Heroku + Supabase"
git push heroku main
# ou: git push heroku master
```

Se o branch principal for outro, use `git push heroku seu-branch:main`.

### 2.5 Template Excel

O arquivo **`public/template.xlsx`** precisa estar no repositório para o build. O Excel é gerado em Node com **ExcelJS**; o script Python não é usado em produção.

---

## 3. Checklist antes do deploy

- [ ] Executou **`supabase/schema.sql`** no Supabase.
- [ ] Criou o bucket **`tax-return-files`** no Storage do Supabase e configurou as policies.
- [ ] Configurou no Heroku: `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] O arquivo **`public/template.xlsx`** está no repositório.
- [ ] Rodou **`npm run build`** localmente e corrigiu erros (e, se quiser testar com Supabase, use **`.env.example`** como base para um `.env.local`).

---

## 4. Resumo da stack (Heroku + Supabase)

| Camada | Tecnologia |
|--------|------------|
| Hospedagem | Heroku (Node.js) |
| Banco + Storage | Supabase (PostgreSQL + Storage) |
| Geração de Excel | ExcelJS (Node), sem Python |
| Variáveis | Heroku Config Vars |

Depois do primeiro deploy, o app usa apenas Supabase para clientes, histórico e arquivos (uploads e Excels gerados).
