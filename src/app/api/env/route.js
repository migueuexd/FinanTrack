export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || null;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null;
  return new Response(JSON.stringify({
    serverSeesUrl: Boolean(url),
    serverSeesKey: Boolean(key),
    url,
    keyPrefix: key ? String(key).slice(0, 8) : null,
  }), { headers: { 'content-type': 'application/json' } });
}




