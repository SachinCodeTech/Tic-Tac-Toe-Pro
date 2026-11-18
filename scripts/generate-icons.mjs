import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const rootDir = process.cwd();
const iconsDir = path.join(rootDir, 'www', 'icons');
const iosAppIconDir = path.join(rootDir, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');

function buildIconSvg({ padded = false } = {}) {
  const scale = padded ? 0.74 : 1;
  const offset = padded ? 133 : 0;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#12172e"/>
      <stop offset="100%" stop-color="#070a1d"/>
    </linearGradient>
    <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00ffff"/>
      <stop offset="100%" stop-color="#0099ff"/>
    </linearGradient>
    <linearGradient id="pinkGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff2eb8"/>
      <stop offset="100%" stop-color="#ff0077"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <g transform="translate(${offset}, ${offset}) scale(${scale})">
    <!-- Subtle neon grid -->
    <g stroke="#00ffff" stroke-opacity="0.28" stroke-width="14" stroke-linecap="round">
      <line x1="394" y1="164" x2="394" y2="860"/>
      <line x1="630" y1="164" x2="630" y2="860"/>
      <line x1="164" y1="394" x2="860" y2="394"/>
      <line x1="164" y1="630" x2="860" y2="630"/>
    </g>
    <!-- Top-left X -->
    <g stroke="url(#cyanGlow)" stroke-width="34" stroke-linecap="round">
      <line x1="210" y1="210" x2="340" y2="340"/>
      <line x1="340" y1="210" x2="210" y2="340"/>
    </g>
    <!-- Center X -->
    <g stroke="url(#cyanGlow)" stroke-width="34" stroke-linecap="round">
      <line x1="447" y1="447" x2="577" y2="577"/>
      <line x1="577" y1="447" x2="447" y2="577"/>
    </g>
    <!-- Bottom-right X -->
    <g stroke="url(#cyanGlow)" stroke-width="34" stroke-linecap="round">
      <line x1="684" y1="684" x2="814" y2="814"/>
      <line x1="814" y1="684" x2="684" y2="814"/>
    </g>
    <!-- Top-right O -->
    <circle cx="749" cy="275" r="68" fill="none" stroke="url(#pinkGlow)" stroke-width="32"/>
    <!-- Bottom-left O -->
    <circle cx="275" cy="749" r="68" fill="none" stroke="url(#pinkGlow)" stroke-width="32"/>
    <!-- Winning diagonal highlight -->
    <line x1="196" y1="196" x2="828" y2="828" stroke="#ffd700" stroke-opacity="0.85" stroke-width="14" stroke-linecap="round"/>
  </g>
</svg>`;
}

async function generate() {
  await fs.mkdir(iconsDir, { recursive: true });

  const standardSvg = buildIconSvg({ padded: false });
  const maskableSvg = buildIconSvg({ padded: true });

  await fs.writeFile(path.join(iconsDir, 'icon.svg'), standardSvg, 'utf8');

  const standardBuf = Buffer.from(standardSvg, 'utf8');
  const maskableBuf = Buffer.from(maskableSvg, 'utf8');

  // Web & PWA PNGs
  await sharp(standardBuf).resize(180, 180).flatten({ background: '#0a0e27' }).png().toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  await sharp(standardBuf).resize(192, 192).flatten({ background: '#0a0e27' }).png().toFile(path.join(iconsDir, 'pwa-192x192.png'));
  await sharp(standardBuf).resize(512, 512).flatten({ background: '#0a0e27' }).png().toFile(path.join(iconsDir, 'pwa-512x512.png'));
  await sharp(maskableBuf).resize(512, 512).flatten({ background: '#0a0e27' }).png().toFile(path.join(iconsDir, 'pwa-maskable-512x512.png'));

  // App Store 1024x1024 opaque PNG (no alpha channel per Apple App Store Connect requirement)
  const appStoreIconPath = path.join(iconsDir, 'app-store-1024.png');
  await sharp(standardBuf)
    .resize(1024, 1024)
    .flatten({ background: '#0a0e27' })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toFile(appStoreIconPath);

  // If Capacitor iOS project exists, sync the 1024x1024 AppIcon directly into Xcode Asset Catalog
  try {
    await fs.access(iosAppIconDir);
    await fs.copyFile(appStoreIconPath, path.join(iosAppIconDir, 'AppIcon-512@2x.png'));
    const contentsJson = {
      images: [
        {
          filename: 'AppIcon-512@2x.png',
          idiom: 'universal',
          platform: 'ios',
          size: '1024x1024'
        }
      ],
      info: {
        author: 'xcode',
        version: 1
      }
    };
    await fs.writeFile(path.join(iosAppIconDir, 'Contents.json'), JSON.stringify(contentsJson, null, 2) + '\n', 'utf8');
    console.log('Synced 1024x1024 opaque AppIcon to ios/App/App/Assets.xcassets/AppIcon.appiconset');
  } catch {
    // iOS folder not generated yet; will be synced after cap add ios
  }

  console.log('Generated all PWA and App Store icons in www/icons/');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
