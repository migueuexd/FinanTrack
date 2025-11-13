"use client";

import styles from "./input.module.css";

export default function Input({ label, ...props }) {
  return (
    <label className={styles.wrap}>
      <span className={styles.label}>{label}</span>
      <input className={styles.input} {...props} />
    </label>
  );
}




