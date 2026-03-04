import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Cliente Supabase com service role — usar apenas no servidor (API routes e Server Components). */
export function getSupabaseServer() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente."
    );
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

/** Nome do bucket de Storage para uploads e Excels gerados. */
export const STORAGE_BUCKET = "tax-return-files";
