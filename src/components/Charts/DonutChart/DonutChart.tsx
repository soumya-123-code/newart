'use client';

import React, { useEffect, useRef } from 'react';
import styles from './DonutChart.module.scss';

interface ChartData {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  title: string;
  total: number;
  data: ChartData[];
}

const DonutChart: React.FC<DonutChartProps> = ({ title, total, data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const size = 240;
    canvas.width = size;
    canvas.height = size;

    // Calculate total value
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    if (totalValue === 0) return;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw donut chart
    let startAngle = -0.5 * Math.PI; // Start at top
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = 100;
    const innerRadius = 65;

    data.forEach((item) => {
      const sliceAngle = (2 * Math.PI * item.value) / totalValue;
      const endAngle = startAngle + sliceAngle;

      // Draw outer arc
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();

      startAngle = endAngle;
    });

  }, [data]);

  return (
    <div className={styles.chartWrapper}>
      <div className={styles.chartCanvas}>
        <canvas ref={canvasRef} />
      </div>
      <div className={styles.legendWrapper}>
        <div className={styles.titleSection}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.total}>{total}: Total</p>
        </div>
        <div className={styles.legend}>
          {data.map((item, index) => (
            <div key={index} className={styles.legendItem}>
              <span 
                className={styles.colorDot} 
                style={{ backgroundColor: item.color }}
              />
              <span className={styles.legendLabel}>
                <strong>{item.value}:</strong> {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DonutChart;
