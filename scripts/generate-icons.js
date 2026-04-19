import fs from 'fs';
import path from 'path';

// Native SVG bypass for compilation failures on Apple Silicon Node ABI v141
function generateSvgIcon(size) {
  const fontSize = Math.floor(size * 0.4);
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#1d4ed8"/>
  <text x="50%" y="50%" font-family="sans-serif" font-weight="bold" font-size="${fontSize}px" fill="#ffffff" text-anchor="middle" dominant-baseline="central">MV</text>
</svg>`;
}

const dir = path.join(process.cwd(), 'public');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

fs.writeFileSync(path.join(dir, 'icon-192.svg'), generateSvgIcon(192));
fs.writeFileSync(path.join(dir, 'icon-512.svg'), generateSvgIcon(512));
fs.writeFileSync(path.join(dir, 'screenshot.svg'), generateSvgIcon(844)); 

console.log('SVG Vector Icons generated successfully in /public');
