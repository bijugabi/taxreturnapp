# Passo a passo — informações do Supabase para o Tax Return App

Siga estes passos no **painel do Supabase** ([app.supabase.com](https://app.supabase.com)) para obter e configurar tudo que o app precisa.

---

## 1. URL do projeto e chave (API)

Essas são as duas informações que você vai usar nas **variáveis de ambiente** (no Heroku ou no `.env.local` para testar em casa).

### Onde encontrar

1. No menu da esquerda, clique em **Settings** (ícone de engrenagem).
2. Clique em **API** no submenu (ou acesse **Project Settings → API**).
3. Na página você verá:

| O que procurar | Nome no painel | Variável que você vai configurar |
|----------------|----------------|-----------------------------------|
| **URL do projeto** | "Project URL" (uma URL como `https://xxxxx.supabase.co`) | `NEXT_PUBLIC_SUPABASE_URL` |
| **Chave service_role** | Na seção "Project API keys", a linha **`service_role`** (não use a `anon` public) | `SUPABASE_SERVICE_ROLE_KEY` |

### O que me passar (ou onde colar)

- **Project URL**  
  Copie o valor completo, por exemplo:  
  `https://abcdefghijk.supabase.co`

- **service_role key**  
  Clique em "Reveal" ao lado de `service_role` e copie a chave inteira (começa com `eyJ...` e é longa).  
  **Importante:** essa chave dá acesso total ao projeto; não compartilhe em rede e não commite no Git. Use só em variáveis de ambiente no servidor (Heroku) ou no `.env.local` local.

**Resumo:** você precisa de **2 valores**: a URL do projeto e a chave `service_role`. São esses que entram em `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.

---

## 2. Criar as tabelas (clientes e histórico)

O app usa duas tabelas. Você as cria rodando o SQL do projeto.

### Onde fazer

1. No menu da esquerda, clique em **SQL Editor**.
2. Clique em **New query**.
3. Abra o arquivo **`supabase/schema.sql`** do seu projeto (na raiz do repositório) e **copie todo o conteúdo**.
4. Cole no editor do Supabase.
5. Clique em **Run** (ou atalho Ctrl+Enter / Cmd+Enter).

Se der certo, aparece uma mensagem de sucesso. As tabelas **`clients`** e **`history`** passam a existir.

**Não precisa me passar nada desse passo** — basta ter executado o SQL com sucesso.

---

## 3. Criar o bucket de arquivos (Storage)

Os arquivos que os usuários enviam e os Excels gerados ficam no Storage do Supabase, em um bucket.

### Onde fazer

1. No menu da esquerda, clique em **Storage**.
2. Clique em **New bucket**.
3. Preencha:
   - **Name:** `tax-return-files`  
     (tem que ser exatamente esse nome; o código usa ele.)
   - **Public bucket:** deixe **desmarcado** (bucket privado).
4. Clique em **Create bucket**.

### Permissões (policies)

Depois de criar o bucket:

1. Clique no nome do bucket **`tax-return-files`**.
2. Vá em **Policies** (ou "Policies" na parte superior).
3. O app usa a chave **service_role** nas APIs, que ignora RLS. Mesmo assim, para evitar bloqueios, você pode criar uma policy que permita tudo para o **service_role**:
   - Clique em **New policy**.
   - Pode usar o template **"For full access"** ou equivalente.
   - Em "Policy definition", use algo como: **Allowed operation:** All (ou marque Select, Insert, Update, Delete).
   - Em "Target roles", marque **service_role** (ou "Allow access to all users" se a interface não mostrar roles).
   - Salve.

Se preferir não criar policy e só testar: no início o app pode funcionar só com a **service_role**; se der erro de permissão ao subir/baixar arquivo, volte aqui e crie a policy acima.

**Não precisa me passar nada desse passo** — só garantir que o bucket **`tax-return-files`** existe e que o acesso está liberado (por policy ou via service_role).

---

## 4. Checklist do que você precisa ter em mãos

Depois de seguir os passos acima, você deve ter:

| # | Onde pegou | Nome da variável | Exemplo (não use o seu aqui no chat) |
|---|------------|------------------|--------------------------------------|
| 1 | Settings → API → Project URL | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| 2 | Settings → API → Project API keys → service_role (Reveal) | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` (bem longa) |

Só essas **duas** informações são necessárias para **configurar o app** (Heroku ou `.env.local`). O resto (tabelas e bucket) você já configura direto no painel, como nos passos 2 e 3.

---

## 5. Onde colocar essas informações no projeto

- **Para rodar localmente:**  
  Crie um arquivo **`.env.local`** na raiz do projeto (ao lado de `package.json`) com:

  ```
  NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=eyJ...sua-chave...
  ANTHROPIC_API_KEY=sk-ant-...   # se for testar processamento com PDF/IA
  ```

  Não commite o `.env.local` (ele já está no `.gitignore`).

- **Para deploy no Heroku:**  
  No painel do Heroku: **Settings → Config Vars → Reveal Config Vars**, e adicione as mesmas três variáveis com os mesmos nomes e valores.

Se quiser, você pode me dizer só **em que etapa parou** (por exemplo: “já rodei o SQL e criei o bucket, mas não acho a service_role”) que eu te guio só nessa parte, sem você precisar colar nenhuma chave aqui.
