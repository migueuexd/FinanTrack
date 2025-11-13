"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import styles from "./styles.module.css";
import TopBar from "@/components/TopBar";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Toast from "@/components/Toast";

export default function CreateAssociationPage() {
  const [associationName, setAssociationName] = useState("");
  const [associationPassword, setAssociationPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!associationName.trim() || !associationPassword) {
      setToast({ show: true, message: "Por favor completa todos los campos", type: "error" });
      return;
    }
    
    setLoading(true);
    const supabase = getSupabase();
    if (!supabase) { 
      setToast({ show: true, message: 'Faltan variables de entorno de Supabase', type: "error" }); 
      setLoading(false);
      return; 
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setToast({ show: true, message: 'Debes estar autenticado para crear una asociación', type: "error" });
      setLoading(false);
      router.push("/login");
      return;
    }

    const { data, error } = await supabase.rpc('create_association', {
      p_name: associationName.trim(),
      p_password: associationPassword,
      p_created_by: user.id
    });

    setLoading(false);
    if (error) {
      setToast({ show: true, message: error.message, type: "error" });
    } else {
      setToast({ show: true, message: `✓ Asociación "${associationName}" creada correctamente`, type: "success" });
      setTimeout(() => {
        router.push("/");
      }, 2000);
    }
  }

  return (
    <main className={styles.container}>
      <TopBar backHref="/" backLabel="Inicio" />
      <h1 className={styles.title}>Crear Asociación</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input 
          label="Nombre de la asociación" 
          type="text" 
          value={associationName} 
          onChange={(e) => setAssociationName(e.target.value)} 
          placeholder="Ej: Familia Pérez, Negocio XYZ..."
          required 
        />
        <Input 
          label="Contraseña de la asociación" 
          type="password" 
          value={associationPassword} 
          onChange={(e) => setAssociationPassword(e.target.value)} 
          placeholder="Esta contraseña la necesitarán otros usuarios para unirse"
          required 
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Creando..." : "Crear asociación"}
        </Button>
        <p className={styles.helpText}>
          La asociación permitirá compartir finanzas entre múltiples usuarios.
          Otros usuarios podrán unirse usando el nombre y la contraseña que definas.
        </p>
      </form>
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


