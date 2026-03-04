# Tax Return at Scale 🇬🇧

App web para processamento de documentos contábeis MTD (Making Tax Digital) — UK.

---

## O que o app faz

1. Contador informa o nome do cliente, seleciona trimestre e ano
2. Faz upload dos documentos (PDF, CSV, JPG, PNG)
3. Clica em **"Processar Documentos"**
4. O app usa o Claude (IA da Anthropic) para extrair receitas e despesas
5. Preenche automaticamente o template Excel oficial do governo britânico
6. Salva o arquivo no Google Drive na pasta do cliente

---

## Pré-requisitos

Você vai precisar instalar:

- **Node.js** (versão 18 ou superior): https://nodejs.org → baixe a versão LTS
- **Python 3** (versão 3.8 ou superior): https://python.org → baixe a versão mais recente

Para verificar se já estão instalados, abra o Terminal e digite:
```bash
node --version
python3 --version
```

---

## Passo a passo de instalação

### Passo 1 — Baixe o projeto

Se você recebeu o projeto como um arquivo ZIP:
- Descompacte a pasta
- Abra o Terminal dentro da pasta do projeto

### Passo 2 — Instale as dependências Node.js

No Terminal, dentro da pasta do projeto:
```bash
npm install
```

Aguarde terminar (pode demorar 1-2 minutos).

### Passo 3 — Instale as dependências Python

```bash
pip3 install openpyxl
```

### Passo 4 — Configure a chave do Claude (Anthropic)

1. Acesse: https://console.anthropic.com
2. Faça login (ou crie uma conta)
3. Vá em **"API Keys"** → **"Create Key"**
4. Copie a chave gerada (começa com `sk-ant-...`)
5. Abra o arquivo `.env.local` na pasta do projeto e substitua:
   ```
   ANTHROPIC_API_KEY=cole_sua_chave_aqui
   ```

### Passo 5 — Configure o Google Drive

Esta é a parte mais trabalhosa, mas você só faz uma vez:

**5.1 — Crie um projeto no Google Cloud:**
1. Acesse: https://console.cloud.google.com
2. Clique em **"Novo Projeto"** → dê um nome (ex: "tax-return-mtd")
3. Clique em **"Criar"**

**5.2 — Ative a Google Drive API:**
1. No menu lateral, vá em **"APIs e Serviços"** → **"Biblioteca"**
2. Pesquise **"Google Drive API"** → clique → **"Ativar"**

**5.3 — Crie uma Service Account:**
1. Vá em **"APIs e Serviços"** → **"Credenciais"**
2. Clique em **"Criar credenciais"** → **"Conta de serviço"**
3. Dê um nome (ex: "tax-return-sa") → **"Criar e continuar"** → **"Concluído"**
4. Clique na conta de serviço criada → aba **"Chaves"**
5. **"Adicionar chave"** → **"Criar nova chave"** → **JSON** → **"Criar"**
6. Um arquivo JSON será baixado → renomeie para `google-credentials.json`
7. Mova este arquivo para dentro da pasta do projeto

**5.4 — Compartilhe a pasta do Drive com a Service Account:**
1. Abra o Google Drive no navegador
2. Crie uma pasta chamada "Clientes MTD" (ou o nome que preferir)
3. Clique com botão direito na pasta → **"Compartilhar"**
4. Cole o email da Service Account (está no arquivo JSON, campo `client_email`)
5. Dê permissão de **"Editor"** → **"Enviar"**
6. Pegue o ID da pasta na URL: `drive.google.com/drive/folders/`**ESTE_ID_AQUI**

**5.5 — Configure o .env.local:**
```
GOOGLE_DRIVE_FOLDER_ID=cole_o_id_da_pasta_aqui
GOOGLE_SERVICE_ACCOUNT_JSON=./google-credentials.json
```

### Passo 6 — Coloque o template Excel

Copie seu arquivo `template.xlsx` (o template oficial do MTD) para a pasta `/public` do projeto.

O arquivo deve ficar em: `public/template.xlsx`

### Passo 7 — Rode o app

```bash
npm run dev
```

Abra o navegador em: **http://localhost:3000**

---

## Estrutura do projeto

```
tax-return-app/
├── app/
│   ├── page.tsx              ← Página principal
│   ├── layout.tsx            ← Layout global
│   ├── globals.css           ← Estilos globais
│   ├── components/
│   │   └── UploadForm.tsx    ← Formulário de upload
│   └── api/
│       └── process/
│           └── route.ts      ← Backend: IA + Python + Drive
├── scripts/
│   └── fill_template.py      ← Script Python que preenche o Excel
├── public/
│   └── template.xlsx         ← ⚠️ VOCÊ PRECISA COLOCAR AQUI
├── .env.local                ← ⚠️ Suas credenciais (nunca commite!)
├── google-credentials.json   ← ⚠️ Credencial Google (nunca commite!)
└── package.json
```

---

## Formatos de arquivo aceitos

| Formato | Funciona bem para |
|---------|------------------|
| **PDF** | Extratos bancários, faturas, recibos digitalizados |
| **CSV** | Exportações de bancos, planilhas |
| **JPG/PNG** | Fotos de recibos, prints de tela |

---

## Prazos MTD 2025/26

| Trimestre | Período | Prazo gov.uk | Prazo interno (D-5) |
|-----------|---------|-------------|-------------------|
| Q1 | Jan – Mar | 30/04 | 25/04 |
| Q2 | Abr – Jun | 31/07 | 26/07 |
| Q3 | Jul – Set | 31/10 | 26/10 |
| Q4 | Out – Dez | 31/01 | 26/01 |

> ⚠️ Após 2 atrasos consecutivos, o cliente recebe multa automática do governo britânico.

---

## Problemas comuns

**"template.xlsx não encontrado"**
→ Copie o template para a pasta `/public` do projeto.

**"ANTHROPIC_API_KEY não configurado"**
→ Verifique o arquivo `.env.local` e reinicie o servidor com `npm run dev`.

**"Erro ao fazer upload para o Drive"**
→ Verifique se compartilhou a pasta com o email da Service Account.

**Script Python não funciona**
→ Tente `pip3 install openpyxl` e verifique com `python3 --version`.

---

## Custo estimado

- **Claude API**: ~$0.01 a $0.05 por documento (centavos de dólar)
- **Google Drive API**: gratuito
- **Hosting (Vercel)**: gratuito para começar

---

## Próximos passos (fases futuras)

- [ ] Portal para o cliente fazer upload direto
- [ ] Integração com 123 Sheets (submissão automática ao gov.uk)
- [ ] Lembretes automáticos por email/WhatsApp
- [ ] Dashboard com status de todos os clientes
