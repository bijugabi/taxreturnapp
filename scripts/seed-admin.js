/**
 * Cria o primeiro utilizador admin na tabela admin_users do Supabase.
 * Utiliza o mesmo algoritmo de hash que a API de login (scrypt).
 *
 * Uso: npm run seed:admin
 * Requer .env ou .env.local com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
 */
const path = require("path");
const fs = require("fs");

// Carregar .env.local e depois .env (Next.js costuma usar .env.local)
function loadEnv() {
  const files = [".env.local", ".env"];
  for (const file of files) {
    const envPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split("\n")) {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, "");
          if (!process.env[key]) process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env ou .env.local"
  );
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
