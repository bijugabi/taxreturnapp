/**
 * Cria o primeiro utilizador admin na tabela admin_users do Supabase.
 * Utiliza o mesmo algoritmo de hash que a API de login (scrypt).
 *
 * Uso: npm run seed:admin
 * Requer .env ou .env.local com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
 */
const path = require("path");
const fs = require("fs");

// Pasta do projeto = pasta acima de scripts/
const projectRoot = path.resolve(__dirname, "..");

function loadEnv() {
  let loadedPath = null;
  const files = [".env.local", ".env"];
  for (const file of files) {
    const envPath = path.join(projectRoot, file);
    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, "utf8");
      if (content.charCodeAt(0) === 0xfeff) content = content.slice(1); // remove BOM
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;
        const eq = line.indexOf("=");
        if (eq === -1) continue;
        const key = line.slice(0, eq).trim();
        let value = line.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = value;
      }
      loadedPath = envPath;
    }
  }
  return loadedPath;
}

const loaded = loadEnv();
if (loaded) {
  console.error("Ficheiro de env carregado:", loaded);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env ou .env.local"
  );
  if (!loaded) console.error("Nenhum ficheiro .env.local ou .env encontrado em:", projectRoot);
  else {
    if (!url) console.error("  — NEXT_PUBLIC_SUPABASE_URL está em falta ou vazio");
    if (!key) console.error("  — SUPABASE_SERVICE_ROLE_KEY está em falta ou vazio");
  }
  process.exit(1);
}

const crypto = require("crypto");

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return { salt: salt.toString("hex"), hash: hash.toString("hex") };
}

async function main() {
  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(url, key);

  const username = process.argv[2] || "admin";
  const password = process.argv[3] || "admin";

  const { salt, hash } = hashPassword(password);

  const { data, error } = await supabase.from("admin_users").upsert(
    { username, salt, password_hash: hash },
    { onConflict: "username" }
  );

  if (error) {
    console.error("Erro ao inserir utilizador:", error.message);
    process.exit(1);
  }

  console.log(`Utilizador "${username}" criado/atualizado com sucesso.`);
}

main();
