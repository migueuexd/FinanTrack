"use client";

import { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import styles from "./styles.module.css";
import TopBar from "@/components/TopBar";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Toast from "@/components/Toast";
import Link from "next/link";

export default function ExpensePage() {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [associationId, setAssociationId] = useState("");
  const [associations, setAssociations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    loadCategories();
    loadAssociations();
  }, []);

  async function loadCategories() {
    const supabase = getSupabase();
    const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
    if (!user || !supabase) return;
    
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .order("name", { ascending: true });
    
    setCategories(data || []);
  }

  async function loadAssociations() {
    const supabase = getSupabase();
    const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
    if (!user || !supabase) return;
    
    const { data } = await supabase
      .from("user_associations")
      .select("association_id, associations (id, name), display_name")
      .eq("user_id", user.id);
    
    const assocList = (data || []).map(ua => ({
      id: ua.associations.id,
      name: ua.associations.name,
      displayName: ua.display_name
    }));
    
    setAssociations(assocList);
    
    // Si tiene solo una asociación, seleccionarla automáticamente
    if (assocList.length === 1) {
      setAssociationId(assocList[0].id);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setToast({ show: false, message: "", type: "success" });
    setLoading(true);
    const supabase = getSupabase();
    const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
    if (!user) { window.location.href = "/login"; return; }
    if (!supabase) { setToast({ show: true, message: 'Faltan variables de entorno de Supabase', type: "error" }); setLoading(false); return; }
    
    // Si el usuario pertenece a asociaciones, la transacción DEBE ser de una asociación
    if (associations.length > 0 && !associationId) {
      setToast({ show: true, message: "Debes seleccionar una asociación", type: "error" });
      setLoading(false);
      return;
    }
    
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "expense",
      amount: Number(amount),
      note: note.trim() || null,
      category_id: categoryId || null,
      association_id: associationId || null,
      occurred_at: new Date().toISOString(),
    });
    setLoading(false);
    if (error) {
      setToast({ show: true, message: error.message, type: "error" });
    } else {
      setToast({ show: true, message: "✓ Gasto registrado correctamente", type: "success" });
      setAmount("");
      setNote("");
      setCategoryId("");
      setAssociationId("");
    }
  }

  return (
    <main className={styles.container}>
      <TopBar backHref="/" backLabel="Inicio" />
      <h1 className={styles.title}>Ingresar gasto</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input label="Monto" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <Input label="Nota" type="text" value={note} onChange={(e) => setNote(e.target.value)} />
        <label className={styles.label}>
          <span>Categoría (opcional)</span>
          <select
            className={styles.select}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Sin categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>
        {associations.length > 0 && (
          <label className={styles.label}>
            <span>Asociación {associations.length === 1 ? "" : "(requerido)"}</span>
            {associations.length === 1 ? (
              <div className={styles.associationInfo}>
                {associations[0].name} (como {associations[0].displayName})
              </div>
            ) : (
              <select
                className={styles.select}
                value={associationId}
                onChange={(e) => setAssociationId(e.target.value)}
                required
              >
                <option value="">Selecciona una asociación</option>
                {associations.map((assoc) => (
                  <option key={assoc.id} value={assoc.id}>
                    {assoc.name} (como {assoc.displayName})
                  </option>
                ))}
              </select>
            )}
          </label>
        )}
        <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
      </form>
      <p className={styles.helpText}>
        <Link href="/categories" style={{color: 'var(--accent)'}}>Gestionar categorías</Link>
      </p>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: "", type: "success" })}
        />
      )}
    </main>
  );
}


