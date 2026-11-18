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
      <stop offset="0%" stop-color="#EFF6FF"/>
      <stop offset="100%" stop-color="#DBEAFE"/>
    </linearGradient>
    <linearGradient id="xGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
    <linearGradient id="oGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FB923C"/>
      <stop offset="100%" stop-color="#EA580C"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <g transform="translate(${offset}, ${offset}) scale(${scale})">
    <rect x="112" y="112" width="800" height="800" rx="140" fill="#FFFFFF" stroke="#BFDBFE" stroke-width="14"/>
    <!-- Tactile board grid -->
    <g stroke="#CBD5E1" stroke-width="16" stroke-linecap="round">
      <line x1="404" y1="184" x2="404" y2="840"/>
      <line x1="620" y1="184" x2="620" y2="840"/>
      <line x1="184" y1="404" x2="840" y2="404"/>
      <line x1="184" y1="620" x2="840" y2="620"/>
    </g>
    <!-- Top-left X -->
    <g stroke="url(#xGrad)" stroke-width="34" stroke-linecap="round">
      <line x1="230" y1="230" x2="350" y2="350"/>
      <line x1="350" y1="230" x2="230" y2="350"/>
    </g>
    <!-- Center X -->
    <g stroke="url(#xGrad)" stroke-width="34" stroke-linecap="round">
      <line x1="452" y1="452" x2="572" y2="572"/>
      <line x1="572" y1="452" x2="452" y2="572"/>
    </g>
    <!-- Bottom-right X -->
    <g stroke="url(#xGrad)" stroke-width="34" stroke-linecap="round">
      <line x1="674" y1="674" x2="794" y2="794"/>
      <line x1="794" y1="674" x2="674" y2="794"/>
    </g>
    <!-- Top-right O -->
    <circle cx="734" cy="290" r="64" fill="none" stroke="url(#oGrad)" stroke-width="34"/>
    <!-- Bottom-left O -->
    <circle cx="290" cy="734" r="64" fill="none" stroke="url(#oGrad)" stroke-width="34"/>
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
  await sharp(standardBuf).resize(180, 180).flatten({ background: '#EFF6FF' }).png().toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  await sharp(standardBuf).resize(192, 192).flatten({ background: '#EFF6FF' }).png().toFile(path.join(iconsDir, 'pwa-192x192.png'));
  await sharp(standardBuf).resize(512, 512).flatten({ background: '#EFF6FF' }).png().toFile(path.join(iconsDir, 'pwa-512x512.png'));
  await sharp(maskableBuf).resize(512, 512).flatten({ background: '#EFF6FF' }).png().toFile(path.join(iconsDir, 'pwa-maskable-512x512.png'));

  // App Store 1024x1024 opaque PNG (no alpha channel per Apple App Store Connect requirement)
  const appStoreIconPath = path.join(iconsDir, 'app-store-1024.png');
  await sharp(standardBuf)
    .resize(1024, 1024)
    .flatten({ background: '#EFF6FF' })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toFile(appStoreIconPath);

  // Sync the 1024x1024 AppIcon directly into Xcode Asset Catalog if present
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
    // iOS folder not generated yet
  }

  console.log('Generated all PWA and App Store icons in www/icons/');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
