import { useEffect, useRef } from 'react';

export function BarChart({ data, currency }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = Math.max(320, rect.width);
    const height = 280;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = '100%';
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const styles = getComputedStyle(document.body);
    const grid = styles.getPropertyValue('--border');
    const muted = styles.getPropertyValue('--text-muted');
    const income = styles.getPropertyValue('--positive');
    const expense = styles.getPropertyValue('--negative');
    const pad = { l: 56, r: 16, t: 18, b: 34 };
    const innerW = width - pad.l - pad.r;
    const innerH = height - pad.t - pad.b;
    const max = nice(Math.max(1, ...data.flatMap((item) => [item.income, item.expense])));

    ctx.strokeStyle = grid;
    ctx.fillStyle = muted;
    ctx.font = '11px system-ui';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= 4; i += 1) {
      const y = pad.t + (innerH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(pad.l + innerW, y);
      ctx.stroke();
      ctx.fillText(axis(max * (1 - i / 4), currency), pad.l - 8, y);
    }

    const group = innerW / data.length;
    const barW = Math.min(24, group * 0.3);
    data.forEach((item, index) => {
      const cx = pad.l + group * index + group / 2;
      drawBar(ctx, cx - barW - 3, pad.t + innerH, barW, (item.income / max) * innerH, income);
      drawBar(ctx, cx + 3, pad.t + innerH, barW, (item.expense / max) * innerH, expense);
      ctx.fillStyle = muted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(item.label, cx, pad.t + innerH + 10);
    });
  }, [data, currency]);

  return <canvas ref={ref} />;
}

function drawBar(ctx, x, baseline, width, height, color) {
  ctx.fillStyle = color;
  const h = Math.max(2, height);
  const y = baseline - h;
  ctx.beginPath();
  ctx.roundRect(x, y, width, h, 5);
  ctx.fill();
}

function nice(value) {
  const exp = Math.floor(Math.log10(value));
  const fraction = value / Math.pow(10, exp);
  const rounded = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return rounded * Math.pow(10, exp);
}

function axis(value, currency) {
  if (value >= 1_000_000) return `${currency}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${currency}${(value / 1_000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  return `${currency}${Math.round(value)}`;
}
