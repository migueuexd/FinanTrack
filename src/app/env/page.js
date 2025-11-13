"use client";

export default function EnvPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return (
    <main style={{padding:24}}>
      <h1>ENV check</h1>
      <p>URL definida: {url ? 'sí' : 'no'}</p>
      <p>ANON KEY definida: {key ? 'sí' : 'no'}</p>
      {url && <p>URL: {url}</p>}
      {key && <p>ANON (primeros 8): {String(key).slice(0,8)}...</p>}
    </main>
  );
}




