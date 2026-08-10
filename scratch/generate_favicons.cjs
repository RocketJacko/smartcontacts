const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// High precision SVG matching the SmartContacts brand logo (overlapping translucent circles + SC geometric monogram)
const svgContent = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Dark Mode / Light Mode Adaptable Rounded Rect Base -->
  <rect width="512" height="512" rx="120" fill="#121212" />

  <g transform="translate(10, 0)">
    <!-- Overlapping Translucent Brand Circles -->
    <!-- Purple Main Sphere -->
    <circle cx="215" cy="205" r="105" fill="#6C5CE7" fill-opacity="0.85" style="mix-blend-mode: screen" />
    
    <!-- Orange/Amber Sphere -->
    <circle cx="310" cy="180" r="88" fill="#F39C12" fill-opacity="0.85" style="mix-blend-mode: screen" />
    
    <!-- Coral/Red-Pink Sphere -->
    <circle cx="295" cy="290" r="88" fill="#E84393" fill-opacity="0.85" style="mix-blend-mode: screen" />
    
    <!-- Blue Sphere -->
    <circle cx="205" cy="295" r="78" fill="#0984E3" fill-opacity="0.80" style="mix-blend-mode: screen" />

    <!-- Satellite Orbit Dots -->
    <circle cx="270" cy="98" r="18" fill="#E84393" />
    <circle cx="372" cy="255" r="17" fill="#0984E3" />
    <circle cx="170" cy="388" r="15" fill="#F39C12" />
    <circle cx="145" cy="272" r="12" fill="#6C5CE7" />
    <circle cx="355" cy="320" r="11" fill="#E84393" />
  </g>

  <!-- Modern Geometric "SC" Monogram Overlay in Center -->
  <g filter="url(#glow)">
    <!-- 'S' Path -->
    <path 
      d="M 235 175 C 190 175 180 205 210 230 C 240 255 255 260 215 295 C 185 320 160 300 160 300" 
      stroke="#FFFFFF" 
      stroke-width="26" 
      stroke-linecap="round" 
      stroke-linejoin="round" 
      fill="none" 
    />
    
    <!-- 'C' Path -->
    <path 
      d="M 350 200 C 310 175 270 205 270 250 C 270 295 310 325 350 300" 
      stroke="#FFFFFF" 
      stroke-width="26" 
      stroke-linecap="round" 
      stroke-linejoin="round" 
      fill="none" 
    />
  </g>
</svg>
`;

const publicDir = path.join(__dirname, '..', 'public');

async function generate() {
  // Save SVG
  const svgPath = path.join(publicDir, 'icon.svg');
  fs.writeFileSync(svgPath, svgContent, 'utf8');
  console.log('Saved icon.svg');

  // Convert to 32x32 Light PNG
  await sharp(Buffer.from(svgContent))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'icon-light-32x32.png'));
  console.log('Saved icon-light-32x32.png');

  // Convert to 32x32 Dark PNG
  await sharp(Buffer.from(svgContent))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'icon-dark-32x32.png'));
  console.log('Saved icon-dark-32x32.png');

  // Convert to 180x180 Apple Touch Icon
  await sharp(Buffer.from(svgContent))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-icon.png'));
  console.log('Saved apple-icon.png');

  // Also save favicon.ico in app and public
  await sharp(Buffer.from(svgContent))
    .resize(48, 48)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Saved favicon.ico');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
