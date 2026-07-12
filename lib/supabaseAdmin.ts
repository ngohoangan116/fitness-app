import { createClient } from "@supabase/supabase-js";

// Server-only client using the Service Role key. This bypasses Row Level
// Security entirely, so it must NEVER be imported into a "use client"
// component or any code that ships to the browser — only inside
// app/api/** Route Handlers, which always run on the server.
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

  if (!url || !serviceKey) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong biến môi trường server."
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
