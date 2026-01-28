/**
 * Creates a simple PDF Editor icon using native Node.js
 * Generates PNG files for macOS .icns creation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const assetsDir = path.join(__dirname, '..', 'assets');
const iconsetDir = path.join(assetsDir, 'icon.iconset');

// Ensure directories exist
if (!fs.existsSync(iconsetDir)) {
  fs.mkdirSync(iconsetDir, { recursive: true });
}

// Create a simple SVG icon
const createSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4F46E5"/>
      <stop offset="100%" style="stop-color:#7C3AED"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
  <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="${size * 0.35}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">PDF</text>
</svg>`;

// Write SVG file
const svgPath = path.join(assetsDir, 'icon.svg');
fs.writeFileSync(svgPath, createSVG(1024));

console.log('Created SVG icon at:', svgPath);
console.log('\nTo create .icns file, you need to:');
console.log('1. Convert SVG to PNG (1024x1024)');
console.log('2. Use sips and iconutil to create .icns');
console.log('\nOr provide a PNG icon file.');
