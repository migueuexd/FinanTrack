"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import styles from "./styles.module.css";
import TopBar from "@/components/TopBar";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Toast from "@/components/Toast";

const COLOR_PALETTE = [
  "#22c55e", // verde accent
  "#16a34a", // verde accent-700
  "#ef4444", // rojo danger
  "#dc2626", // rojo danger-700
  "#3b82f6", // azul
  "#8b5cf6", // morado
  "#f59e0b", // amarillo
  "#ec4899", // rosa
  "#06b6d4", // cyan
  "#6366f1", // indigo
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: "", type: "expense", color: COLOR_PALETTE[0] });
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const supabase = getSupabase();
    const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
    if (!user) { window.location.href = "/login"; return; }
    if (!supabase) { setCategories([]); setLoading(false); return; }
    
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("type", { ascending: true })
      .order("name", { ascending: true });
    
    if (error) {
      setToast({ show: true, message: error.message, type: "error" });
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    setToast({ show: false, message: "", type: "success" });
    const supabase = getSupabase();
    const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
    if (!user || !supabase) {
      setToast({ show: true, message: 'Error de autenticación', type: "error" });
      return;
    }

    if (editingId) {
      // Actualizar
      const { error } = await supabase
        .from("categories")
        .update({ name: formData.name.trim(), color: formData.color })
        .eq("id", editingId)
        .eq("user_id", user.id);
      
      if (error) {
        setToast({ show: true, message: error.message, type: "error" });
      } else {
        setToast({ show: true, message: "✓ Categoría actualizada", type: "success" });
        setEditingId(null);
        setFormData({ name: "", type: "expense", color: COLOR_PALETTE[0] });
        loadCategories();
      }
    } else {
      // Crear
      const { error } = await supabase
        .from("categories")
        .insert({
          user_id: user.id,
          name: formData.name.trim(),
          type: formData.type,
          color: formData.color,
        });
      
      if (error) {
        setToast({ show: true, message: error.message, type: "error" });
      } else {
        setToast({ show: true, message: "✓ Categoría creada", type: "success" });
        setFormData({ name: "", type: "expense", color: COLOR_PALETTE[0] });
        loadCategories();
      }
    }
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar esta categoría?")) return;
    
    const supabase = getSupabase();
    const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
    if (!user || !supabase) return;

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      setToast({ show: true, message: error.message, type: "error" });
    } else {
      setToast({ show: true, message: "✓ Categoría eliminada", type: "success" });
      loadCategories();
    }
  }

  function handleEdit(category) {
    setEditingId(category.id);
    setFormData({ name: category.name, type: category.type, color: category.color });
  }

  function handleCancel() {
    setEditingId(null);
    setFormData({ name: "", type: "expense", color: COLOR_PALETTE[0] });
  }

  const incomeCategories = categories.filter(c => c.type === "income");
  const expenseCategories = categories.filter(c => c.type === "expense");

  if (loading) return <main className={styles.container}>Cargando...</main>;

  return (
    <main className={styles.container}>
      <TopBar backHref="/" backLabel="Inicio" />
      <h1 className={styles.title}>Categorías</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Nombre"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ej. Salario, Comida..."
          required
        />
        
        <label className={styles.label}>
          <span>Tipo</span>
          <select
            className={styles.select}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            disabled={!!editingId}
          >
            <option value="income">Ingreso</option>
            <option value="expense">Gasto</option>
          </select>
        </label>

        <label className={styles.label}>
          <span>Color</span>
          <div className={styles.colorPicker}>
            {COLOR_PALETTE.map((color) => (
              <button
                key={color}
                type="button"
                className={`${styles.colorOption} ${formData.color === color ? styles.colorSelected : ""}`}
                style={{ backgroundColor: color }}
                onClick={() => setFormData({ ...formData, color })}
              />
            ))}
          </div>
        </label>

        <div className={styles.formActions}>
          <Button type="submit">{editingId ? "Actualizar" : "Crear"}</Button>
          {editingId && (
            <Button type="button" variant="secondary" onClick={handleCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </form>

      <div className={styles.categoriesGrid}>
        <div className={styles.categorySection}>
          <h2 className={styles.sectionTitle}>Ingresos</h2>
          {incomeCategories.length === 0 ? (
            <p className={styles.empty}>No hay categorías de ingresos</p>
          ) : (
            <div className={styles.categoryList}>
              {incomeCategories.map((cat) => (
                <div key={cat.id} className={styles.categoryItem}>
                  <div className={styles.categoryInfo}>
                    <div
                      className={styles.categoryColor}
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className={styles.categoryName}>{cat.name}</span>
                  </div>
                  <div className={styles.categoryActions}>
                    <button
                      className={styles.editBtn}
                      onClick={() => handleEdit(cat)}
                    >
                      Editar
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(cat.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.categorySection}>
          <h2 className={styles.sectionTitle}>Gastos</h2>
          {expenseCategories.length === 0 ? (
            <p className={styles.empty}>No hay categorías de gastos</p>
          ) : (
            <div className={styles.categoryList}>
              {expenseCategories.map((cat) => (
                <div key={cat.id} className={styles.categoryItem}>
                  <div className={styles.categoryInfo}>
                    <div
                      className={styles.categoryColor}
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className={styles.categoryName}>{cat.name}</span>
                  </div>
                  <div className={styles.categoryActions}>
                    <button
                      className={styles.editBtn}
                      onClick={() => handleEdit(cat)}
                    >
                      Editar
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(cat.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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

