// Run this once: node generate-icons.mjs
// It creates public/icon-192.png and public/icon-512.png
import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const r = size * 0.18; // corner radius

  // Background — dark slate
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // Globe emoji as text
  ctx.font = `${size * 0.52}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🌏', size / 2, size * 0.42);

  // "SAY" text below
  ctx.font = `bold ${size * 0.14}px -apple-system, sans-serif`;
  ctx.fillStyle = '#60a5fa';
  ctx.fillText('HOW DO I SAY', size / 2, size * 0.82);

  return canvas.toBuffer('image/png');
}

mkdirSync('public', { recursive: true });
writeFileSync('public/icon-192.png', drawIcon(192));
writeFileSync('public/icon-512.png', drawIcon(512));
console.log('Icons generated: public/icon-192.png, public/icon-512.png');
