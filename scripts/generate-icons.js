import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <radialGradient id="darkBg" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#23242a" />
      <stop offset="70%" stop-color="#16171b" />
      <stop offset="100%" stop-color="#0f1013" />
    </radialGradient>

    <!-- Yellow Header Gradient with 3D sheen -->
    <linearGradient id="yellowHeader" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffd53d" />
      <stop offset="45%" stop-color="#fbc02d" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>

    <!-- Binder Ring 3D Gradient -->
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#eab308" />
      <stop offset="25%" stop-color="#fef08a" />
      <stop offset="65%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>

    <!-- Subtle Drop Shadow for Ring holes -->
    <filter id="ringShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#78350f" flood-opacity="0.35" />
    </filter>

    <!-- Drop Shadow for Calendar Card -->
    <filter id="cardShadow" x="-20%" y="-15%" width="140%" height="145%">
      <feDropShadow dx="0" dy="28" stdDeviation="30" flood-color="#000000" flood-opacity="0.65" />
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.4" />
    </filter>

    <!-- Page Layers subtle shadow -->
    <filter id="pageShadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#64748b" flood-opacity="0.2" />
    </filter>
  </defs>

  <!-- Dark Background Canvas -->
  <rect width="512" height="512" rx="112" fill="url(#darkBg)" />

  <!-- Calendar Group with Shadow -->
  <g filter="url(#cardShadow)">
    <!-- Bottom Stacked Pages Lip (3D depth layer 3) -->
    <rect x="110" y="386" width="292" height="30" rx="28" fill="#d1d5db" />
    <!-- Bottom Stacked Pages Lip (3D depth layer 2) -->
    <rect x="104" y="380" width="304" height="30" rx="28" fill="#e2e8f0" />
    <!-- Bottom Stacked Pages Lip (3D depth layer 1) -->
    <rect x="98" y="374" width="316" height="30" rx="28" fill="#f1f5f9" />

    <!-- Main White Calendar Card Body -->
    <rect x="92" y="196" width="328" height="204" rx="48" fill="#ffffff" filter="url(#pageShadow)" />

    <!-- Top Yellow Header with rounded top corners -->
    <path d="M 92 216 L 92 148 Q 92 104 136 104 L 376 104 Q 420 104 420 148 L 420 216 Z" fill="url(#yellowHeader)" />

    <!-- Subtle divider line between header and white page -->
    <line x1="92" y1="216" x2="420" y2="216" stroke="#fbbf24" stroke-width="1.5" stroke-opacity="0.6" />
    <line x1="92" y1="217.5" x2="420" y2="217.5" stroke="#fef08a" stroke-width="1" stroke-opacity="0.4" />

    <!-- Left side: 3x3 Soft Grid Days -->
    <!-- Row 1 -->
    <rect x="136" y="246" width="28" height="24" rx="7" fill="#d1d5db" opacity="0.6" />
    <rect x="174" y="246" width="28" height="24" rx="7" fill="#d1d5db" opacity="0.6" />
    <rect x="212" y="246" width="28" height="24" rx="7" fill="#d1d5db" opacity="0.6" />

    <!-- Row 2 -->
    <rect x="136" y="282" width="28" height="24" rx="7" fill="#cbd5e1" opacity="0.75" />
    <rect x="174" y="282" width="28" height="24" rx="7" fill="#cbd5e1" opacity="0.75" />
    <rect x="212" y="282" width="28" height="24" rx="7" fill="#cbd5e1" opacity="0.75" />

    <!-- Row 3 -->
    <rect x="136" y="318" width="28" height="24" rx="7" fill="#cbd5e1" opacity="0.75" />
    <rect x="174" y="318" width="28" height="24" rx="7" fill="#cbd5e1" opacity="0.75" />
    <rect x="212" y="318" width="28" height="24" rx="7" fill="#cbd5e1" opacity="0.75" />

    <!-- Right side: Crisp Bold "15" -->
    <text x="328" y="325"
          font-family="system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif"
          font-size="118"
          font-weight="700"
          letter-spacing="-4"
          text-anchor="middle"
          fill="#1e2430">15</text>

    <!-- 3 Golden Yellow Binder Rings on Top with 3D Depth -->
    <!-- Ring 1 (Left) -->
    <g filter="url(#ringShadow)">
      <!-- Ring loop -->
      <rect x="156" y="74" width="26" height="58" rx="13" fill="url(#ringGrad)" />
      <!-- Ring inner hole/depth shadow -->
      <ellipse cx="169" cy="132" rx="10" ry="4" fill="#b45309" opacity="0.4" />
      <rect x="160" y="78" width="6" height="42" rx="3" fill="#ffffff" opacity="0.45" />
    </g>

    <!-- Ring 2 (Center) -->
    <g filter="url(#ringShadow)">
      <rect x="243" y="74" width="26" height="58" rx="13" fill="url(#ringGrad)" />
      <ellipse cx="256" cy="132" rx="10" ry="4" fill="#b45309" opacity="0.4" />
      <rect x="247" y="78" width="6" height="42" rx="3" fill="#ffffff" opacity="0.45" />
    </g>

    <!-- Ring 3 (Right) -->
    <g filter="url(#ringShadow)">
      <rect x="330" y="74" width="26" height="58" rx="13" fill="url(#ringGrad)" />
      <ellipse cx="343" cy="132" rx="10" ry="4" fill="#b45309" opacity="0.4" />
      <rect x="334" y="78" width="6" height="42" rx="3" fill="#ffffff" opacity="0.45" />
    </g>
  </g>
</svg>`;

async function main() {
  const publicDir = path.resolve('public');
  const distDir = path.resolve('dist');

  // 1. Write public/icon.svg
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);
  console.log('Saved public/icon.svg');

  const svgBuffer = Buffer.from(svgContent);

  // 2. Generate PNGs with sharp
  const targets = [
    { file: 'pwa-512x512.png', size: 512 },
    { file: 'pwa-192x192.png', size: 192 },
    { file: 'pwa-maskable-512x512.png', size: 512 },
    { file: 'apple-touch-icon.png', size: 180 },
    { file: 'logo.png', size: 512 },
  ];

  for (const t of targets) {
    const pngBuf = await sharp(svgBuffer).resize(t.size, t.size).png().toBuffer();
    fs.writeFileSync(path.join(publicDir, t.file), pngBuf);
    if (fs.existsSync(distDir)) {
      fs.writeFileSync(path.join(distDir, t.file), pngBuf);
    }
    console.log(`Generated ${t.file} (${t.size}x${t.size})`);
  }

  // Also copy icon.svg to dist if dist exists
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'icon.svg'), svgContent);
  }

  console.log('All icons generated successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
