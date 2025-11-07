'use client';

import styles from './BarChart.module.scss';

interface BarData {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarData[];
  title?: string;
  color?: string;
  height?: number;
}

export default function BarChart({
  data,
  title,
  color = '#2196F3',
  height = 300,
}: BarChartProps) {
  const maxValue = Math.max(...data.map((item) => item.value));
  const minValue = Math.min(...data.map((item) => item.value));
  const range = maxValue - minValue;

  return (
    <div className={styles.container}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <div className={styles.chartWrapper} style={{ height: `${height}px` }}>
        <div className={styles.yAxis}>
          <span className={styles.yLabel}>{maxValue}</span>
          <span className={styles.yLabel}>{Math.round(maxValue / 2)}</span>
          <span className={styles.yLabel}>0</span>
        </div>
        <div className={styles.chart}>
          <div className={styles.gridLines}>
            <div className={styles.gridLine}></div>
            <div className={styles.gridLine}></div>
            <div className={styles.gridLine}></div>
          </div>
          <div className={styles.bars}>
            {data.map((item, index) => {
              const barHeight = range > 0 ? ((item.value - minValue) / range) * 100 : 0;
              return (
                <div key={index} className={styles.barWrapper}>
                  <div className={styles.barContainer}>
                    <span className={styles.valueLabel}>{item.value}</span>
                    <div
                      className={styles.bar}
                      style={{
                        height: `${barHeight}%`,
                        backgroundColor: color,
                      }}
                    ></div>
                  </div>
                  <span className={styles.label}>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
