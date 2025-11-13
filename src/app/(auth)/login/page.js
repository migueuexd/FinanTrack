"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import Link from "next/link";
import styles from "./styles.module.css";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import TopBar from "@/components/TopBar";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) window.location.href = "/";
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = getSupabase();
    if (!supabase) { setError('Faltan variables de entorno de Supabase'); setLoading(false); return; }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else window.location.href = "/";
  }

  async function handleForgot() {
    setError("");
    setInfo("");
    const supabase = getSupabase();
    if (!supabase) { setError('Faltan variables de entorno de Supabase'); return; }
    if (!email) { setError('Ingresa tu email para recuperar'); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
    });
    if (error) setError(error.message);
    else setInfo('Te enviamos un correo con el enlace de recuperación.');
  }

  return (
    <main className={styles.container}>
      <TopBar backHref="/" backLabel="Inicio" />
      <h1 className={styles.title}>Iniciar sesión</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className={styles.error}>{error}</p>}
        {info && <p className={styles.info}>{info}</p>}
        <Button type="submit" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</Button>
        <button type="button" onClick={handleForgot} className={styles.linkBtn}>¿Olvidaste tu contraseña?</button>
      </form>
      <p>
        ¿No tienes cuenta? <Link href="/register">Regístrate</Link>
      </p>
    </main>
  );
}


