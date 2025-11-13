"use client";

import { useEffect } from "react";
import styles from "./toast.module.css";

export default function Toast({ message, type = "success", onClose, duration = 3000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!message) return null;

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <div className={styles.content}>
        <span className={styles.icon}>
          {type === "success" ? "✓" : "✕"}
        </span>
        <span className={styles.message}>{message}</span>
      </div>
      <button className={styles.close} onClick={onClose} aria-label="Cerrar">×</button>
    </div>
  );
}



