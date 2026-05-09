import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;

// Server-side client using service key — all DB ops in this app are server-only
export const supabase = createClient(url, process.env.SUPABASE_SERVICE_KEY!);

// Alias for explicit webhook/admin usage
export const supabaseAdmin = supabase;
