import { useEffect, useRef } from 'react';
import { formatMoney } from '../../lib/formatters.js';

export function DonutChart({ data, currency, empty = 'No data' }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const size = 220;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const total = data.reduce((sum, item) => sum + item.value, 0);
    const styles = getComputedStyle(document.body);
    const center = size / 2;
    const radius = center - 8;
    const inner = radius * 0.58;

    if (!total) {
      ctx.strokeStyle = styles.getPropertyValue('--border');
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(center, center, (radius + inner) / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = styles.getPropertyValue('--text-muted');
      ctx.font = '13px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(empty, center, center);
      return;
    }

    let start = -Math.PI / 2;
    data.forEach((item) => {
      const end = start + (item.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();
      start = end;
    });

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(center, center, inner, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = styles.getPropertyValue('--text-muted');
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Total', center, center - 10);
    ctx.fillStyle = styles.getPropertyValue('--text');
    ctx.font = 'bold 16px system-ui';
    ctx.fillText(formatMoney(total, currency), center, center + 10);
  }, [data, currency, empty]);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="chart-stack">
      <canvas ref={ref} />
      <div className="chart-legend">
        {total === 0 ? (
          <div className="legend-empty">{empty}</div>
        ) : (
          data.map((item) => (
            <div className="legend-item" key={item.name}>
              <span className="legend-dot" style={{ background: item.color }} />
              <span className="legend-name">{item.name}</span>
              <span className="legend-value">
                {formatMoney(item.value, currency)}
                <span className="legend-pct">{((item.value / total) * 100).toFixed(1)}%</span>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
