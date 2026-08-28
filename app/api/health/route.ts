import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return NextResponse.json({
    ok: Boolean(supabaseUrl && supabaseAnonKey),
    supabase: {
      urlConfigured: Boolean(supabaseUrl),
      anonKeyConfigured: Boolean(supabaseAnonKey),
      anonKeyLength: supabaseAnonKey?.length ?? 0,
    },
    server: {
      geminiConfigured: Boolean(geminiKey),
      geminiKeyLength: geminiKey?.length ?? 0,
      serviceRoleConfigured: Boolean(serviceRole),
      serviceRoleLength: serviceRole?.length ?? 0,
    },
    checkedAt: new Date().toISOString(),
  });
}
