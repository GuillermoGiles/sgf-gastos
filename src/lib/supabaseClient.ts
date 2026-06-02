import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Único cliente principal para autenticación y base de datos
export const supabase = createClient(supabaseUrl, supabaseKey);

// Mantenemos la función por compatibilidad, pero siempre devuelve el mismo cliente
export const createClientForCompany = (empresaId: string) => {
  return supabase;
};
