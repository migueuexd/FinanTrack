"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import styles from "./page.module.css";
import Button from "@/components/ui/Button";

export default function Home() {
  const [userEmail, setUserEmail] = useState("");
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email || ""));
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Finantrack</h1>
        <p>Gestor de finanzas personales</p>
        {userEmail ? (
          <div className={styles.ctas}>
            <Link href="/income"><Button variant="primary" icon="+">Ingreso</Button></Link>
            <Link href="/expense"><Button variant="danger" icon="−">Gasto</Button></Link>
            <Link href="/history"><Button variant="secondary">Historial</Button></Link>
            <Link href="/categories"><Button variant="secondary">Categorías</Button></Link>
            <Link href="/profile"><Button variant="secondary">Perfil</Button></Link>
          </div>
        ) : (
          <div className={styles.ctas}>
            <Link href="/login"><Button variant="primary">Iniciar sesión</Button></Link>
            <Link href="/register"><Button variant="secondary">Registrarse</Button></Link>
          </div>
        )}
      </main>
    </div>
  );
}
