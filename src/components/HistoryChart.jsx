"use client";

import { useMemo } from "react";
import styles from "./historyChart.module.css";

export default function HistoryChart({ transactions }) {
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return null;

    // Ordenar por fecha ascendente
    const sorted = [...transactions].sort((a, b) => 
      new Date(a.occurred_at) - new Date(b.occurred_at)
    );

    // Calcular balance acumulado
    let balance = 0;
    const points = sorted.map((t) => {
      if (t.type === "income") balance += Number(t.amount);
      else balance -= Number(t.amount);
      return {
        date: new Date(t.occurred_at),
        balance,
        type: t.type,
        amount: Number(t.amount),
      };
    });

    return points;
  }, [transactions]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className={styles.chartContainer}>
        <p className={styles.noData}>No hay datos para mostrar</p>
      </div>
    );
  }

  const width = 600;
  const height = 300;
  const padding = { top: 20, right: 60, bottom: 40, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calcular rangos
  const balances = chartData.map((d) => d.balance);
  const minBalance = Math.min(0, ...balances);
  const maxBalance = Math.max(...balances);
  const balanceRange = maxBalance - minBalance || 1;

  const dates = chartData.map((d) => d.date.getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const dateRange = maxDate - minDate || 1;

  // Convertir datos a coordenadas
  const points = chartData.map((point, i) => ({
    x: padding.left + ((point.date.getTime() - minDate) / dateRange) * chartWidth,
    y: padding.top + chartHeight - ((point.balance - minBalance) / balanceRange) * chartHeight,
    balance: point.balance,
    date: point.date,
    type: point.type,
  }));

  // Generar path para la línea
  const pathData = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // Generar path con colores según sube/baja
  const coloredPaths = [];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const isUp = curr.balance >= prev.balance;
    coloredPaths.push(
      <line
        key={i}
        x1={prev.x}
        y1={prev.y}
        x2={curr.x}
        y2={curr.y}
        stroke={isUp ? "var(--accent)" : "#ef4444"}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    );
  }

  // Etiquetas del eje Y (derecha)
  const yLabels = 5;
  const yTickValues = [];
  for (let i = 0; i <= yLabels; i++) {
    const value = minBalance + (balanceRange / yLabels) * i;
    const y = padding.top + chartHeight - ((value - minBalance) / balanceRange) * chartHeight;
    yTickValues.push({ value, y });
  }

  // Etiquetas del eje X (abajo) - mostrar algunas fechas
  const xLabels = Math.min(5, points.length);
  const xTickValues = [];
  for (let i = 0; i < xLabels; i++) {
    const idx = Math.floor((points.length - 1) * (i / (xLabels - 1)));
    if (points[idx]) {
      xTickValues.push({
        x: points[idx].x,
        date: points[idx].date,
      });
    }
  }

  return (
    <div className={styles.chartContainer}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.chart} preserveAspectRatio="xMidYMid meet">
        {/* Líneas de la grilla */}
        {yTickValues.map((tick, i) => (
          <line
            key={`grid-y-${i}`}
            x1={padding.left}
            y1={tick.y}
            x2={padding.left + chartWidth}
            y2={tick.y}
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="3,3"
            opacity="0.3"
          />
        ))}

        {/* Líneas coloreadas */}
        {coloredPaths}

        {/* Puntos */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill={p.type === "income" ? "var(--accent)" : "#ef4444"}
            stroke="var(--bg)"
            strokeWidth="2"
          />
        ))}

        {/* Eje Y - Etiquetas de dinero (derecha) */}
        {yTickValues.map((tick, i) => (
          <g key={`y-label-${i}`}>
            <text
              x={padding.left + chartWidth + 10}
              y={tick.y + 4}
              fill="var(--text-muted)"
              fontSize="11"
              textAnchor="start"
            >
              ${tick.value.toFixed(0)}
            </text>
          </g>
        ))}

        {/* Eje X - Etiquetas de fechas (abajo) */}
        {xTickValues.map((tick, i) => (
          <g key={`x-label-${i}`}>
            <text
              x={tick.x}
              y={height - 10}
              fill="var(--text-muted)"
              fontSize="10"
              textAnchor="middle"
            >
              {tick.date.toLocaleDateString("es", {
                month: "short",
                day: "numeric",
              })}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

