/**
 * Fix Android status bar color to #01A89E (teal)
 * Run AFTER: npx cap add android
 * 
 * Usage: node scripts/fix-android-statusbar.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"

const ROOT = process.cwd()
const ANDROID_RES = join(ROOT, "android", "app", "src", "main", "res")
const VALUES_DIR = join(ANDROID_RES, "values")
const STYLES_FILE = join(VALUES_DIR, "styles.xml")
const COLORS_FILE = join(VALUES_DIR, "colors.xml")

console.log("=== Configurando StatusBar Android #01A89E ===\n")

if (!existsSync(join(ROOT, "android"))) {
  console.error("[ERROR] Carpeta android/ no encontrada. Ejecuta primero: npx cap add android")
  process.exit(1)
}

// 1. Fix styles.xml - set status bar color
if (existsSync(STYLES_FILE)) {
  let styles = readFileSync(STYLES_FILE, "utf-8")
  
  // Add or replace statusBarColor
  if (styles.includes("statusBarColor")) {
    styles = styles.replace(
      /<item name="android:statusBarColor">.*?<\/item>/,
      '<item name="android:statusBarColor">#01A89E</item>'
    )
  } else {
    // Insert before closing </style> of the first style block
    styles = styles.replace(
      /<\/style>/,
      '    <item name="android:statusBarColor">#01A89E</item>\n    </style>'
    )
  }

  // Ensure light status bar (white icons on teal background)
  if (!styles.includes("windowLightStatusBar")) {
    styles = styles.replace(
      /<\/style>/,
      '    <item name="android:windowLightStatusBar">false</item>\n    </style>'
    )
  } else {
    styles = styles.replace(
      /<item name="android:windowLightStatusBar">.*?<\/item>/,
      '<item name="android:windowLightStatusBar">false</item>'
    )
  }

  // Ensure navigation bar color too
  if (!styles.includes("navigationBarColor")) {
    styles = styles.replace(
      /<\/style>/,
      '    <item name="android:navigationBarColor">#FFFFFF</item>\n    </style>'
    )
  }

  writeFileSync(STYLES_FILE, styles, "utf-8")
  console.log("[OK] styles.xml actualizado con statusBarColor #01A89E")
} else {
  // Create styles.xml from scratch
  mkdirSync(VALUES_DIR, { recursive: true })
  const styles = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="android:statusBarColor">#01A89E</item>
        <item name="android:windowLightStatusBar">false</item>
        <item name="android:navigationBarColor">#FFFFFF</item>
        <item name="colorPrimary">#01A89E</item>
        <item name="colorPrimaryDark">#018F87</item>
        <item name="colorAccent">#F48221</item>
    </style>
    <style name="AppTheme.NoActionBar" parent="AppTheme">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
    </style>
</resources>
`
  writeFileSync(STYLES_FILE, styles, "utf-8")
  console.log("[OK] styles.xml CREADO con statusBarColor #01A89E")
}

// 2. Fix colors.xml if it exists
if (existsSync(COLORS_FILE)) {
  let colors = readFileSync(COLORS_FILE, "utf-8")
  // Replace any existing colorPrimary
  if (colors.includes("colorPrimary")) {
    colors = colors.replace(
      /<color name="colorPrimary">.*?<\/color>/,
      '<color name="colorPrimary">#01A89E</color>'
    )
  }
  writeFileSync(COLORS_FILE, colors, "utf-8")
  console.log("[OK] colors.xml actualizado")
}

console.log("\n=== StatusBar configurado correctamente ===")
console.log("Iconos de status bar: BLANCOS (windowLightStatusBar=false)")
console.log("Fondo status bar: #01A89E (teal)")
console.log("Fondo navigation bar: #FFFFFF (blanco)")
