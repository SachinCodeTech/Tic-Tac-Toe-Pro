import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const rootDir = process.cwd();
const iconsDir = path.join(rootDir, 'www', 'icons');
const iosAppIconDir = path.join(rootDir, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
const androidResDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'res');

function buildIconSvg({ padded = false } = {}) {
  const scale = padded ? 0.74 : 1;
  const offset = padded ? 133 : 0;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fbff"/>
      <stop offset="100%" stop-color="#dfeaff"/>
    </linearGradient>
    <linearGradient id="xGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
    <linearGradient id="oGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e"/>
      <stop offset="100%" stop-color="#e11d48"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <g transform="translate(${offset}, ${offset}) scale(${scale})">
    <rect x="128" y="128" width="768" height="768" rx="96" fill="#ffffff" stroke="#cbd5e1" stroke-width="10"/>
    <g stroke="#cbd5e1" stroke-width="14" stroke-linecap="round">
      <line x1="384" y1="184" x2="384" y2="840"/>
      <line x1="640" y1="184" x2="640" y2="840"/>
      <line x1="184" y1="384" x2="840" y2="384"/>
      <line x1="184" y1="640" x2="840" y2="640"/>
    </g>
    <!-- Top-left X -->
    <g stroke="url(#xGrad)" stroke-width="34" stroke-linecap="round">
      <line x1="216" y1="216" x2="328" y2="328"/>
      <line x1="328" y1="216" x2="216" y2="328"/>
    </g>
    <!-- Center X -->
    <g stroke="url(#xGrad)" stroke-width="34" stroke-linecap="round">
      <line x1="456" y1="456" x2="568" y2="568"/>
      <line x1="568" y1="456" x2="456" y2="568"/>
    </g>
    <!-- Bottom-right X -->
    <g stroke="url(#xGrad)" stroke-width="34" stroke-linecap="round">
      <line x1="696" y1="696" x2="808" y2="808"/>
      <line x1="808" y1="696" x2="696" y2="808"/>
    </g>
    <!-- Top-right O -->
    <circle cx="752" cy="272" r="58" fill="none" stroke="url(#oGrad)" stroke-width="32"/>
    <!-- Bottom-left O -->
    <circle cx="272" cy="752" r="58" fill="none" stroke="url(#oGrad)" stroke-width="32"/>
    <!-- Winning diagonal line -->
    <line x1="198" y1="198" x2="826" y2="826" stroke="#f59e0b" stroke-opacity="0.85" stroke-width="14" stroke-linecap="round"/>
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
  await sharp(standardBuf).resize(180, 180).flatten({ background: '#f4f7fb' }).png().toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  await sharp(standardBuf).resize(192, 192).flatten({ background: '#f4f7fb' }).png().toFile(path.join(iconsDir, 'pwa-192x192.png'));
  await sharp(standardBuf).resize(512, 512).flatten({ background: '#f4f7fb' }).png().toFile(path.join(iconsDir, 'pwa-512x512.png'));
  await sharp(maskableBuf).resize(512, 512).flatten({ background: '#f4f7fb' }).png().toFile(path.join(iconsDir, 'pwa-maskable-512x512.png'));

  // App Store 1024x1024 opaque PNG (no alpha channel per Apple App Store Connect requirement)
  const appStoreIconPath = path.join(iconsDir, 'app-store-1024.png');
  await sharp(standardBuf)
    .resize(1024, 1024)
    .flatten({ background: '#f4f7fb' })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toFile(appStoreIconPath);

  // Sync Xcode Asset Catalog if ios/ exists
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
    // iOS folder not present
  }

  // Sync Android launcher icons if android/ exists
  try {
    await fs.access(androidResDir);
    const androidSizes = [
      { dir: 'mipmap-mdpi', size: 48 },
      { dir: 'mipmap-hdpi', size: 72 },
      { dir: 'mipmap-xhdpi', size: 96 },
      { dir: 'mipmap-xxhdpi', size: 144 },
      { dir: 'mipmap-xxxhdpi', size: 192 }
    ];
    for (const { dir, size } of androidSizes) {
      const targetDir = path.join(androidResDir, dir);
      await fs.mkdir(targetDir, { recursive: true });
      await sharp(standardBuf).resize(size, size).flatten({ background: '#f4f7fb' }).png().toFile(path.join(targetDir, 'ic_launcher.png'));
      await sharp(maskableBuf).resize(size, size).flatten({ background: '#f4f7fb' }).png().toFile(path.join(targetDir, 'ic_launcher_round.png'));
    }
    console.log('Synced Android launcher icons to android/app/src/main/res/');
  } catch {
    // Android folder not yet generated
  }

  console.log('Generated all bright all-age PWA, iOS, and Android icons in www/icons/');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
