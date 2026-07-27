/**
 * Generate Android app icons and splash screen from the source icon.
 * 
 * This creates all the required mipmap icon sizes for Android
 * and a splash screen drawable.
 * 
 * Usage: node scripts/generate-android-icons.mjs
 * Requires: sharp (npm install sharp --save-dev)
 */

import sharp from "sharp"
import { mkdirSync, existsSync, copyFileSync } from "fs"
import { join } from "path"

const ROOT = process.cwd()
// Try multiple possible source icon paths
const ICON_CANDIDATES = [
  join(ROOT, "public", "lazo-512-fondoB.png"),
  join(ROOT, "public", "icono512.png"),
  join(ROOT, "public", "icono-vnj-negro.jpg"),
  join(ROOT, "public", "icons", "icon-512x512.png"),
  join(ROOT, "public", "images", "logo8-22app.png"),
  join(ROOT, "public", "images", "logo8appb.png"),
  join(ROOT, "public", "logo.png"),
]
const SOURCE_ICON = ICON_CANDIDATES.find(p => existsSync(p)) || null
const ANDROID_RES = join(ROOT, "android", "app", "src", "main", "res")

// Android mipmap sizes for launcher icons
const ICON_SIZES = [
  { folder: "mipmap-mdpi", size: 48 },
  { folder: "mipmap-hdpi", size: 72 },
  { folder: "mipmap-xhdpi", size: 96 },
  { folder: "mipmap-xxhdpi", size: 144 },
  { folder: "mipmap-xxxhdpi", size: 192 },
]

// Foreground icon sizes for adaptive icons (with padding)
const ADAPTIVE_SIZES = [
  { folder: "mipmap-mdpi", size: 108 },
  { folder: "mipmap-hdpi", size: 162 },
  { folder: "mipmap-xhdpi", size: 216 },
  { folder: "mipmap-xxhdpi", size: 324 },
  { folder: "mipmap-xxxhdpi", size: 432 },
]

// Splash screen drawable sizes
const SPLASH_SIZES = [
  { folder: "drawable", size: 480 },
  { folder: "drawable-mdpi", size: 480 },
  { folder: "drawable-hdpi", size: 800 },
  { folder: "drawable-xhdpi", size: 1200 },
  { folder: "drawable-xxhdpi", size: 1600 },
  { folder: "drawable-xxxhdpi", size: 1920 },
]

async function main() {
  let sourceIcon = SOURCE_ICON

  if (!sourceIcon) {
    console.log("No source icon found in any expected location.")
    console.log("Generating a branded CamareroPorFavor icon automatically...")
    
    // Generate a branded 512x512 icon with the VJ logo on teal background
    const svg = Buffer.from(`
      <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <rect width="512" height="512" rx="96" fill="#01A89E"/>
        <text x="256" y="320" font-family="Arial, Helvetica, sans-serif" font-size="220" 
              font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">VJ</text>
      </svg>
    `)
    sourceIcon = join(ROOT, "_generated_icon_512.png")
    await sharp(svg).resize(512, 512).png().toFile(sourceIcon)
    console.log(`Generated temporary icon: ${sourceIcon}`)
  }

  console.log(">>> Using source icon:", sourceIcon)

  if (!existsSync(ANDROID_RES)) {
    console.error(`Android res folder not found: ${ANDROID_RES}`)
    console.error("Run 'npx cap add android' first.")
    process.exit(1)
  }

  console.log(">>> Generating Android icons from", sourceIcon)

  // Generate standard launcher icons (ic_launcher.png)
  for (const { folder, size } of ICON_SIZES) {
    const dir = join(ANDROID_RES, folder)
    mkdirSync(dir, { recursive: true })

    await sharp(sourceIcon)
      .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(join(dir, "ic_launcher.png"))

    // Round icon (same as regular for now)
    await sharp(sourceIcon)
      .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(join(dir, "ic_launcher_round.png"))

    console.log(`  ic_launcher.png (${size}x${size}) -> ${folder}`)
  }

  // Generate adaptive icon foreground (ic_launcher_foreground.png)
  for (const { folder, size } of ADAPTIVE_SIZES) {
    const dir = join(ANDROID_RES, folder)
    mkdirSync(dir, { recursive: true })

    // Adaptive icons need ~66% of the canvas for the icon with padding around
    const iconSize = Math.round(size * 0.66)

    await sharp(sourceIcon)
      .resize(iconSize, iconSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: Math.round((size - iconSize) / 2),
        bottom: Math.round((size - iconSize) / 2),
        left: Math.round((size - iconSize) / 2),
        right: Math.round((size - iconSize) / 2),
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .resize(size, size) // ensure exact size after extend rounding
      .png()
      .toFile(join(dir, "ic_launcher_foreground.png"))

    console.log(`  ic_launcher_foreground.png (${size}x${size}) -> ${folder}`)
  }

  // Generate splash screen images
  for (const { folder, size } of SPLASH_SIZES) {
    const dir = join(ANDROID_RES, folder)
    mkdirSync(dir, { recursive: true })

    // Splash: icon centered on brand-color background
    const iconSize = Math.round(size * 0.35)

    await sharp(sourceIcon)
      .resize(iconSize, iconSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: Math.round((size - iconSize) / 2),
        bottom: Math.round((size - iconSize) / 2),
        left: Math.round((size - iconSize) / 2),
        right: Math.round((size - iconSize) / 2),
        background: { r: 1, g: 168, b: 158, alpha: 255 }, // #01A89E
      })
      .resize(size, size)
      .png()
      .toFile(join(dir, "splash.png"))

    console.log(`  splash.png (${size}x${size}) -> ${folder}`)
  }

  // Also create a plain 1024x1024 icon for the Play Store listing
  const storeDir = join(ROOT, "android", "store-assets")
  mkdirSync(storeDir, { recursive: true })
  await sharp(SOURCE_ICON)
    .resize(1024, 1024, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(join(storeDir, "play-store-icon-512.png"))
  console.log("  play-store-icon-512.png (1024x1024) -> android/store-assets/")

  console.log("\n>>> All icons generated successfully!")
  console.log(">>> Now run: npx cap copy android && npx cap sync android")
}

main().catch((err) => {
  console.error("Error generating icons:", err)
  process.exit(1)
})
