"use client";

import styles from "./button.module.css";

export default function Button({ children, variant = "primary", icon, className = "", ...props }) {
  const variantClass = variant === "primary" ? styles.primary : variant === "danger" ? styles.danger : styles.secondary;
  const cls = [styles.btn, variantClass, className].join(" ");
  return (
    <button className={cls} {...props}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  );
}


