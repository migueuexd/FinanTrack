"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import Link from "next/link";
import styles from "./styles.module.css";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import TopBar from "@/components/TopBar";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [associationOption, setAssociationOption] = useState(""); // "", "link", "create"
  const [associations, setAssociations] = useState([]);
  const [selectedAssociation, setSelectedAssociation] = useState("");
  const [associationPassword, setAssociationPassword] = useState("");
  const [associationDisplayName, setAssociationDisplayName] = useState("");
  // Para crear asociación
  const [newAssociationName, setNewAssociationName] = useState("");
  const [newAssociationPassword, setNewAssociationPassword] = useState("");
  const [newAssociationDisplayName, setNewAssociationDisplayName] = useState("");

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) window.location.href = "/";
    });
    loadAssociations();
  }, []);

  async function loadAssociations() {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase
      .from("associations")
      .select("id, name")
      .order("name", { ascending: true });
    setAssociations(data || []);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    const supabase = getSupabase();
    if (!supabase) { setError('Faltan variables de entorno de Supabase'); setLoading(false); return; }
    
    // Crear cuenta
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined }
    });
    
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!signUpData.user) {
      setError('Error al crear la cuenta');
      setLoading(false);
      return;
    }

    // Si se quiere vincular a una asociación existente
    if (associationOption === "link" && selectedAssociation && associationPassword && associationDisplayName) {
      try {
        const selectedAssoc = associations.find(a => a.id === selectedAssociation);
        if (!selectedAssoc) {
          setError('Asociación no encontrada');
          setLoading(false);
          return;
        }

        // Esperar un momento para asegurar que el usuario esté completamente creado en la base de datos
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Intentar vincular usando la función RPC (ahora con permisos mejorados)
        const { data: assocId, error: joinError } = await supabase.rpc('join_association', {
          p_assoc_name: selectedAssoc.name,
          p_password: associationPassword,
          p_display_name: associationDisplayName.trim(),
          p_user_id: signUpData.user.id
        });

        if (joinError) {
          console.error('Error al vincular asociación:', joinError);
          setError(`Cuenta creada, pero error al vincular asociación: ${joinError.message}. Por favor, inicia sesión y verifica tus datos de asociación.`);
          setLoading(false);
          return;
        }

        if (!assocId) {
          setError('Cuenta creada, pero no se pudo vincular la asociación. Por favor, inicia sesión e intenta vincular manualmente.');
          setLoading(false);
          return;
        }

        setLoading(false);
        setInfo("✓ Cuenta creada y vinculada a la asociación. Revisa tu email para confirmar tu cuenta.");
        return;
      } catch (err) {
        setError(`Cuenta creada, pero error al vincular asociación: ${err.message}`);
        setLoading(false);
        return;
      }
    }

    // Si se quiere crear una nueva asociación
    if (associationOption === "create" && newAssociationName && newAssociationPassword && newAssociationDisplayName) {
      try {
        // Crear la asociación
        const { data: assocData, error: createError } = await supabase.rpc('create_association', {
          p_name: newAssociationName.trim(),
          p_password: newAssociationPassword,
          p_created_by: signUpData.user.id
        });

        if (createError) {
          setError(`Cuenta creada, pero error al crear asociación: ${createError.message}`);
          setLoading(false);
          return;
        }

        // Esperar un momento para asegurar que la asociación esté completamente creada
        await new Promise(resolve => setTimeout(resolve, 500));

        // Vincular al usuario a la asociación que acaba de crear
        const { data: assocId, error: joinError } = await supabase.rpc('join_association', {
          p_assoc_name: newAssociationName.trim(),
          p_password: newAssociationPassword,
          p_display_name: newAssociationDisplayName.trim(),
          p_user_id: signUpData.user.id
        });

        if (joinError || !assocId) {
          console.error('Error al vincular después de crear asociación:', joinError);
          setError(`Cuenta y asociación creadas, pero error al vincular. Por favor, inicia sesión e intenta vincular manualmente desde tu perfil.`);
          setLoading(false);
          return;
        }

        setLoading(false);
        setInfo(`✓ Cuenta creada y asociación "${newAssociationName}" creada correctamente. Revisa tu email para confirmar tu cuenta.`);
        return;
      } catch (err) {
        setError(`Cuenta creada, pero error al crear asociación: ${err.message}`);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    setInfo("Revisa tu email para confirmar tu cuenta.");
  }

  return (
    <main className={styles.container}>
      <TopBar backHref="/login" backLabel="Login" />
      <h1 className={styles.title}>Registro</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        
        <div className={styles.associationOptions}>
          <label className={styles.radioLabel}>
            <input 
              type="radio" 
              name="associationOption"
              value=""
              checked={associationOption === ""}
              onChange={(e) => setAssociationOption("")}
            />
            <span>Sin asociación</span>
          </label>
          <label className={styles.radioLabel}>
            <input 
              type="radio" 
              name="associationOption"
              value="link"
              checked={associationOption === "link"}
              onChange={(e) => setAssociationOption("link")}
            />
            <span>Vincular a una asociación existente</span>
          </label>
          <label className={styles.radioLabel}>
            <input 
              type="radio" 
              name="associationOption"
              value="create"
              checked={associationOption === "create"}
              onChange={(e) => setAssociationOption("create")}
            />
            <span>Crear una nueva asociación</span>
          </label>
        </div>

        {associationOption === "link" && (
          <div className={styles.associationFields}>
            <label className={styles.label}>
              <span>Asociación</span>
              <select
                className={styles.select}
                value={selectedAssociation}
                onChange={(e) => setSelectedAssociation(e.target.value)}
                required
              >
                <option value="">Selecciona una asociación</option>
                {associations.map((assoc) => (
                  <option key={assoc.id} value={assoc.id}>
                    {assoc.name}
                  </option>
                ))}
              </select>
            </label>
            <Input 
              label="Contraseña de la asociación" 
              type="password" 
              value={associationPassword} 
              onChange={(e) => setAssociationPassword(e.target.value)}
              required
            />
            <Input 
              label="Tu nombre en la asociación" 
              type="text" 
              value={associationDisplayName} 
              onChange={(e) => setAssociationDisplayName(e.target.value)}
              placeholder="Ej: Juan, María..."
              required
            />
          </div>
        )}

        {associationOption === "create" && (
          <div className={styles.associationFields}>
            <Input 
              label="Nombre de la asociación" 
              type="text" 
              value={newAssociationName} 
              onChange={(e) => setNewAssociationName(e.target.value)}
              placeholder="Ej: Familia Pérez, Negocio XYZ..."
              required
            />
            <Input 
              label="Contraseña de la asociación" 
              type="password" 
              value={newAssociationPassword} 
              onChange={(e) => setNewAssociationPassword(e.target.value)}
              placeholder="Esta contraseña la necesitarán otros usuarios para unirse"
              required
            />
            <Input 
              label="Tu nombre en la asociación" 
              type="text" 
              value={newAssociationDisplayName} 
              onChange={(e) => setNewAssociationDisplayName(e.target.value)}
              placeholder="Ej: Juan, María..."
              required
            />
            <p className={styles.helpText}>
              La asociación se creará automáticamente y te vincularás como miembro.
            </p>
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}
        {info && <p className={styles.info}>{info}</p>}
        <Button type="submit" disabled={loading}>{loading ? "Enviando..." : "Crear cuenta"}</Button>
      </form>
      <p>
        ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
      </p>
    </main>
  );
}


