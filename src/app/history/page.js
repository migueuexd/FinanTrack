"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import styles from "./styles.module.css";
import TopBar from "@/components/TopBar";
import Button from "@/components/ui/Button";
import HistoryChart from "@/components/HistoryChart";

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = getSupabase();
      const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
      if (!user) { window.location.href = "/login"; return; }
      if (!supabase) { setItems([]); setLoading(false); return; }
      
      // Usar la función RPC que devuelve las transacciones con los display_names ya incluidos
      const { data, error } = await supabase.rpc('get_transactions_with_users');
      
      if (error) {
        console.error('Error obteniendo transacciones:', error);
        // Fallback a consulta normal si la función RPC falla
        const { data: fallbackData } = await supabase
          .from("transactions")
          .select(`
            id,
            type,
            amount,
            note,
            occurred_at,
            category_id,
            association_id,
            user_id,
            categories (id, name, color),
            associations (id, name)
          `)
          .order("occurred_at", { ascending: false });
        
        setItems((fallbackData || []).map(t => ({
          ...t,
          category: t.categories ? t.categories.name : null,
          categoryColor: t.categories ? t.categories.color : null,
          userName: t.user_id === user.id ? "Tú" : "Usuario",
          associationName: t.associations ? t.associations.name : null,
        })));
        setLoading(false);
        return;
      }
      
      // Mapear los datos de la función RPC
      setItems((data || []).map(t => {
        let userName = null;
        if (t.association_id && t.user_display_name) {
          // Si es de asociación y tenemos display_name
          userName = t.user_display_name;
        } else if (t.user_id === user.id) {
          userName = "Tú";
        } else {
          userName = "Usuario";
        }
        
        return {
          id: t.id,
          type: t.type,
          amount: t.amount,
          note: t.note,
          occurred_at: t.occurred_at,
          category_id: t.category_id,
          association_id: t.association_id,
          user_id: t.user_id,
          category: t.category_name || null,
          categoryColor: t.category_color || null,
          userName: userName,
          associationName: t.association_name || null,
        };
      }));
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter(t => {
      if (type && t.type !== type) return false;
      if (q) {
        const needle = q.toLowerCase();
        const hay = `${t.note || ""} ${t.category}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (from && new Date(t.occurred_at) < new Date(from)) return false;
      if (to && new Date(t.occurred_at) > new Date(to + 'T23:59:59')) return false;
      return true;
    });
  }, [items, type, q, from, to]);

  if (loading) return <main className={styles.container}>Cargando...</main>;

  const totalIncome = filtered.filter(i => i.type === "income").reduce((a, b) => a + Number(b.amount), 0);
  const totalExpense = filtered.filter(i => i.type === "expense").reduce((a, b) => a + Number(b.amount), 0);
  const balance = totalIncome - totalExpense;

  function exportCSV() {
    const rows = [
      ["fecha", "tipo", "monto", "categoria", "nota"],
      ...filtered.map(t => [
        new Date(t.occurred_at).toISOString(),
        t.type,
        Number(t.amount).toFixed(2),
        t.category || "",
        t.note || "",
      ]),
    ];
    const csv = rows.map(r => r.map(field => `"${String(field).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finantrack_historial.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className={styles.container}>
      <TopBar backHref="/" backLabel="Inicio" />
      <h1 className={styles.title}>Historial</h1>
      <div className={styles.filters}>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Tipo: todos</option>
          <option value="income">Ingresos</option>
          <option value="expense">Gastos</option>
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nota o categoría" />
        <Button onClick={exportCSV}>Exportar CSV</Button>
      </div>
      <div className={styles.summary}>
        <div>
          <div className={styles.summaryLabel}>Ingresos</div>
          <div className={styles.summaryValue} style={{color: 'var(--accent)'}}>${totalIncome.toFixed(2)}</div>
        </div>
        <div>
          <div className={styles.summaryLabel}>Gastos</div>
          <div className={styles.summaryValue} style={{color: '#ef4444'}}>${totalExpense.toFixed(2)}</div>
        </div>
        <div>
          <div className={styles.summaryLabel}>Balance</div>
          <div className={styles.summaryValue} style={{color: balance >= 0 ? 'var(--accent)' : '#ef4444'}}>${balance.toFixed(2)}</div>
        </div>
      </div>
      <HistoryChart transactions={filtered} />
      <ul className={styles.list}>
        {filtered.map((t) => (
          <li key={t.id} className={t.type === 'income' ? styles.income : styles.expense}>
            <div className={styles.transactionHeader}>
              <span>{new Date(t.occurred_at).toLocaleString()}</span>
              {t.associationName && (
                <span className={styles.associationTag}>{t.associationName}</span>
              )}
            </div>
            <strong>${Number(t.amount).toFixed(2)}</strong>
            <em>
              {t.category && (
                <span className={styles.categoryTag} style={{ backgroundColor: t.categoryColor || 'var(--accent)' }}>
                  {t.category}
                </span>
              )}
              {t.note || ""}
            </em>
            {t.userName && (
              <div className={styles.userTag}>por {t.userName}</div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}


