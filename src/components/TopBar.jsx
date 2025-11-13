"use client";

import Link from "next/link";
import styles from "./topbar.module.css";

export default function TopBar({ backHref = "/", backLabel = "Inicio" }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.safe} />
      <div className={styles.bar}>
        <Link href={backHref} className={styles.back} aria-label={`Volver a ${backLabel}`}>
          <span className={styles.chev}>‹</span>
          <span>{backLabel}</span>
        </Link>
        <div className={styles.title}>Finantrack</div>
        <div className={styles.spacer} />
      </div>
    </div>
  );
}


