import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Public client — used in Server Components and the browser for read-only
// catalog data. Row Level Security policies (see supabase/schema.sql)
// restrict this key to reading sets/cards/variants and inserting orders.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
