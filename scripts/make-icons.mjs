import sharp from "sharp";
const svg = "public/icons/icon.svg";
for (const s of [192, 512]) await sharp(svg).resize(s, s).png().toFile(`public/icons/icon-${s}.png`);
await sharp(svg).resize(180, 180).png().toFile("public/icons/apple-touch-icon.png");
// maskable: full-bleed background, glyph inside safe zone (already within 80%)
await sharp(svg).resize(512, 512).png().toFile("public/icons/maskable-512.png");
await sharp(svg).resize(48, 48).png().toFile("src/app/icon.png");
console.log("ok");
