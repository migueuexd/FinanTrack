"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import styles from "./styles.module.css";
import TopBar from "@/components/TopBar";
import Button from "@/components/ui/Button";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [associations, setAssociations] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }

    setUser(currentUser);

    // Obtener asociaciones del usuario
    const { data: userAssocData } = await supabase
      .from("user_associations")
      .select(`
        display_name,
        associations (
          id,
          name
        )
      `)
      .eq("user_id", currentUser.id);

    if (userAssocData) {
      setAssociations(userAssocData.map(ua => ({
        id: ua.associations.id,
        name: ua.associations.name,
        displayName: ua.display_name
      })));
    }

    setLoading(false);
  }

  async function handleLogout() {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <main className={styles.container}>
        <TopBar backHref="/" backLabel="Inicio" />
        <div className={styles.loading}>Cargando...</div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <TopBar backHref="/" backLabel="Inicio" />
      <h1 className={styles.title}>Perfil</h1>

      <div className={styles.profileSection}>
        <h2 className={styles.sectionTitle}>Información Personal</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Correo electrónico:</span>
            <span className={styles.infoValue}>{user?.email || "No disponible"}</span>
          </div>
          {user?.user_metadata?.name && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Nombre:</span>
              <span className={styles.infoValue}>{user.user_metadata.name}</span>
            </div>
          )}
        </div>
      </div>

      {associations.length > 0 && (
        <div className={styles.profileSection}>
          <h2 className={styles.sectionTitle}>Asociaciones</h2>
          <div className={styles.associationsList}>
            {associations.map((assoc) => (
              <div key={assoc.id} className={styles.associationItem}>
                <div className={styles.associationInfo}>
                  <span className={styles.associationName}>{assoc.name}</span>
                  <span className={styles.associationDisplayName}>como {assoc.displayName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.actionsSection}>
        <Button variant="danger" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </div>
    </main>
  );
}


