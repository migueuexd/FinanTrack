"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import styles from "./nav.module.css";

export default function Nav() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email || ""));
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email || ""));
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  return (
    <nav className={styles.nav}>
      <div className={styles.brand}><Link href="/">Finantrack</Link></div>
      <div className={styles.links}>
        {email ? (
          <>
            <Link href="/income">Ingreso</Link>
            <Link href="/expense">Gasto</Link>
            <Link href="/history">Historial</Link>
            <Link href="/categories">Categorías</Link>
            <Link href="/profile">Perfil</Link>
          </>
        ) : (
          <>
            <Link href="/login">Entrar</Link>
            <Link href="/register">Registro</Link>
          </>
        )}
      </div>
    </nav>
  );
}


