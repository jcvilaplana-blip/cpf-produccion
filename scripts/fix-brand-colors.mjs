/**
 * CamareroPorFavor Brand Fix Script - VERSION DEFINITIVA
 * Reemplaza TODOS los colores azules por los colores de marca
 * Ejecutar: node scripts/fix-brand-colors.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync, copyFileSync, existsSync, mkdirSync, unlinkSync } from "node:fs"
import { join, extname, dirname } from "node:path"

var ROOT = process.cwd()

// ========================================
// 1. REWRITE globals.css COMPLETO
// ========================================
function fixGlobalsCss() {
  var cssPath = join(ROOT, "app", "globals.css")
  if (!existsSync(cssPath)) { console.log("[SKIP] globals.css no encontrado"); return }

  var original = readFileSync(cssPath, "utf-8")
  var lines = original.split("\n")
  var keepLines = []
  var insideBlock = false
  var braceCount = 0

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i]
    if (!insideBlock && (line.match(/^:root\s*\{/) || line.match(/^\.dark\s*\{/))) {
      insideBlock = true
      braceCount = 0
      for (var c = 0; c < line.length; c++) {
        if (line[c] === "{") braceCount++
        if (line[c] === "}") braceCount--
      }
      if (braceCount <= 0) insideBlock = false
      continue
    }
    if (insideBlock) {
      for (var c = 0; c < line.length; c++) {
        if (line[c] === "{") braceCount++
        if (line[c] === "}") braceCount--
      }
      if (braceCount <= 0) insideBlock = false
      continue
    }
    keepLines.push(line)
  }

  var newCssBlocks = `
:root {
  --background: #fafafa;
  --foreground: #171717;
  --card: #ffffff;
  --card-foreground: #171717;
  --popover: #ffffff;
  --popover-foreground: #171717;
  --primary: #01A89E;
  --primary-foreground: #ffffff;
  --secondary: #f5f5f4;
  --secondary-foreground: #171717;
  --muted: #f5f5f4;
  --muted-foreground: #737373;
  --accent: #f5f5f4;
  --accent-foreground: #171717;
  --destructive: #dc2626;
  --destructive-foreground: #ffffff;
  --border: #e5e5e5;
  --input: #e5e5e5;
  --ring: #01A89E;
  --chart-1: #F48221;
  --chart-2: #01A89E;
  --chart-3: #334155;
  --chart-4: #eab308;
  --chart-5: #f97316;
  --radius: 0.75rem;
  --sidebar: #ffffff;
  --sidebar-foreground: #171717;
  --sidebar-primary: #01A89E;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #f5f5f4;
  --sidebar-accent-foreground: #171717;
  --sidebar-border: #e5e5e5;
  --sidebar-ring: #01A89E;
}

.dark {
  --background: #0a0a0a;
  --foreground: #fafafa;
  --card: #171717;
  --card-foreground: #fafafa;
  --popover: #0a0a0a;
  --popover-foreground: #fafafa;
  --primary: #01C4B8;
  --primary-foreground: #fafafa;
  --secondary: #262626;
  --secondary-foreground: #fafafa;
  --muted: #262626;
  --muted-foreground: #a3a3a3;
  --accent: #262626;
  --accent-foreground: #fafafa;
  --destructive: #b91c1c;
  --destructive-foreground: #fafafa;
  --border: #404040;
  --input: #262626;
  --ring: #01C4B8;
  --chart-1: #F48221;
  --chart-2: #01C4B8;
  --chart-3: #eab308;
  --chart-4: #a855f7;
  --chart-5: #f87171;
  --sidebar: #171717;
  --sidebar-foreground: #fafafa;
  --sidebar-primary: #01C4B8;
  --sidebar-primary-foreground: #fafafa;
  --sidebar-accent: #262626;
  --sidebar-accent-foreground: #fafafa;
  --sidebar-border: #404040;
  --sidebar-ring: #01C4B8;
}
`
  var result = keepLines.join("\n") + "\n" + newCssBlocks
  writeFileSync(cssPath, result, "utf-8")
  console.log("[OK] globals.css REESCRITO con colores #01A89E y #F48221")
}

// ========================================
// 2. FIX hardcoded colors - AGRESIVO
// ========================================
var EXTENSIONS = [".tsx", ".ts", ".css", ".jsx", ".js"]

// TODOS los hex azules/cyan/sky posibles -> teal #01A89E
var HEX_TO_TEAL = [
  "#248FCC", "#1e88c7", "#2196F3", "#1976D2", "#0288D1",
  "#0891b2", "#06b6d4", "#0ea5e9", "#0284c7", "#0369a1",
  "#155e75", "#164e63", "#0e7490", "#22d3ee", "#67e8f9",
  "#38bdf8", "#7dd3fc", "#bae6fd", "#e0f2fe",
  "#2563eb", "#3b82f6", "#1d4ed8", "#1e40af", "#60a5fa",
  "#93c5fd", "#bfdbfe", "#dbeafe",
  "#0d9488", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4",
  "#0f766e", "#115e59", "#134e4a",
  "#0c4a6e", "#075985", "#0c6393",
  "#0077b6", "#0096c7", "#00b4d8", "#48cae4", "#90e0ef",
  "#023e8a", "#0353a4", "#006494",
]

// Colores claros de esas familias -> teal claro
var HEX_TO_TEAL_LIGHT = [
  "#a5f3fc", "#cffafe", "#ecfeff",
  "#ccfbf1", "#f0fdfa",
  "#f0f9ff", "#e0f2fe",
]

// Tailwind class replacements: bg-X-NNN, text-X-NNN, border-X-NNN, from-X-NNN, to-X-NNN, via-X-NNN, ring-X-NNN
var TAILWIND_FAMILIES = ["blue", "cyan", "sky", "lightBlue"]
var TAILWIND_PREFIXES = ["bg-", "text-", "border-", "from-", "to-", "via-", "ring-", "outline-", "shadow-", "divide-", "placeholder-"]
var TAILWIND_SHADES = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"]

// Build tailwind replacement map
var TAILWIND_REPLACEMENTS = []
for (var fi = 0; fi < TAILWIND_FAMILIES.length; fi++) {
  var family = TAILWIND_FAMILIES[fi]
  for (var pi = 0; pi < TAILWIND_PREFIXES.length; pi++) {
    var prefix = TAILWIND_PREFIXES[pi]
    for (var si = 0; si < TAILWIND_SHADES.length; si++) {
      var shade = TAILWIND_SHADES[si]
      var oldClass = prefix + family + "-" + shade
      var newClass = prefix + "teal-" + shade
      TAILWIND_REPLACEMENTS.push([oldClass, newClass])
    }
  }
}

// oklch replacements
var OKLCH_PATTERNS = [
  ["oklch(0.63 0.14 175)", "#01A89E"],
  ["oklch(0.68 0.14 175)", "#01C4B8"],
  ["oklch(0.646 0.222 41.116)", "#F48221"],
  ["oklch(0.6 0.118 184.704)", "#01A89E"],
  ["oklch(0.577 0.245 27.325)", "#dc2626"],
]

function replaceAll(str, search, replacement) {
  var result = str
  while (result.indexOf(search) !== -1) {
    result = result.split(search).join(replacement)
  }
  return result
}

function getAllFiles(dir, files) {
  if (!files) files = []
  try {
    var entries = readdirSync(dir)
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i]
      if (entry === "node_modules" || entry === ".next" || entry === ".git" || entry === "android" || entry === "ios" || entry === "out") continue
      var fullPath = join(dir, entry)
      try {
        var stat = statSync(fullPath)
        if (stat.isDirectory()) getAllFiles(fullPath, files)
        else if (EXTENSIONS.indexOf(extname(fullPath)) !== -1) files.push(fullPath)
      } catch (e) { /* skip */ }
    }
  } catch (e) { /* skip */ }
  return files
}

function fixHardcodedColors() {
  var files = getAllFiles(ROOT)
  var count = 0

  for (var f = 0; f < files.length; f++) {
    var filePath = files[f]
    var content = readFileSync(filePath, "utf-8")
    var originalContent = content

    // 1. Replace hex colors -> teal
    for (var r = 0; r < HEX_TO_TEAL.length; r++) {
      content = replaceAll(content, HEX_TO_TEAL[r], "#01A89E")
      // Also lowercase version
      content = replaceAll(content, HEX_TO_TEAL[r].toLowerCase(), "#01A89E")
    }

    // 2. Replace light hex -> teal light
    for (var r = 0; r < HEX_TO_TEAL_LIGHT.length; r++) {
      content = replaceAll(content, HEX_TO_TEAL_LIGHT[r], "#ccfbf1")
      content = replaceAll(content, HEX_TO_TEAL_LIGHT[r].toLowerCase(), "#ccfbf1")
    }

    // 3. Replace Tailwind classes blue/cyan/sky -> teal
    for (var r = 0; r < TAILWIND_REPLACEMENTS.length; r++) {
      content = replaceAll(content, TAILWIND_REPLACEMENTS[r][0], TAILWIND_REPLACEMENTS[r][1])
    }

    // 4. Replace oklch patterns
    for (var r = 0; r < OKLCH_PATTERNS.length; r++) {
      content = replaceAll(content, OKLCH_PATTERNS[r][0], OKLCH_PATTERNS[r][1])
    }

    // 5. Replace old orange hex
    content = replaceAll(content, "#FF6900", "#F48221")
    content = replaceAll(content, "#ff6900", "#F48221")
    content = replaceAll(content, "#FF6B00", "#F48221")
    content = replaceAll(content, "#ff6b00", "#F48221")

    if (content !== originalContent) {
      writeFileSync(filePath, content, "utf-8")
      console.log("  [FIX] " + filePath.replace(ROOT, "."))
      count++
    }
  }
  console.log("[OK] " + count + " archivos con colores actualizados")
}

// ========================================
// 3. FIX logos
// ========================================
function fixLogos() {
  var copies = [
    [join(ROOT, "public", "images", "logo8-22app.png"), join(ROOT, "public", "logo-vnj-negro.png")],
    [join(ROOT, "public", "images", "logo8appb.png"), join(ROOT, "public", "logo-cpf.png")],
    [join(ROOT, "public", "images", "logo8appb.png"), join(ROOT, "public", "logo-blanco.png")],
    [join(ROOT, "public", "icono512.png"), join(ROOT, "public", "icons", "icon-512x512.png")],
    [join(ROOT, "public", "icono512.png"), join(ROOT, "public", "icons", "icon-192x192.png")],
    [join(ROOT, "public", "icono512.png"), join(ROOT, "public", "favicon.ico")],
  ]

  for (var i = 0; i < copies.length; i++) {
    var src = copies[i][0]
    var dst = copies[i][1]
    if (existsSync(src)) {
      try {
        var dir = dirname(dst)
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
        copyFileSync(src, dst)
        console.log("  [OK] " + dst.replace(ROOT, "."))
      } catch (e) {
        console.log("  [WARN] " + e.message)
      }
    } else {
      console.log("  [WARN] No encontrado: " + src.replace(ROOT, "."))
    }
  }
}

// ========================================
// 4. Remove old icons
// ========================================
function removeOldIcons() {
  var oldFiles = [
    join(ROOT, "public", "icono1-azul-512.png"),
    join(ROOT, "public", "icono1-azul-512-0.png"),
    join(ROOT, "public", "icono0.png"),
    join(ROOT, "public", "logoR-fondo-azul.png"),
    join(ROOT, "public", "logoR-fondo-blanco.png"),
  ]
  for (var i = 0; i < oldFiles.length; i++) {
    if (existsSync(oldFiles[i])) {
      try {
        unlinkSync(oldFiles[i])
        console.log("  [OK] Eliminado: " + oldFiles[i].replace(ROOT, "."))
      } catch (e) { /* skip */ }
    }
  }
}

// ========================================
// RUN
// ========================================
console.log("")
console.log("===========================================")
console.log("  CamareroPorFavor - Aplicando marca correcta")
console.log("  Colores: #01A89E (teal) + #F48221 (naranja)")
console.log("  VERSION DEFINITIVA - Reemplaza TODOS")
console.log("  los azules/cyan/sky en todos los archivos")
console.log("===========================================")
console.log("")

console.log("1. Reescribiendo globals.css...")
fixGlobalsCss()
console.log("")

console.log("2. Reemplazando colores en componentes...")
fixHardcodedColors()
console.log("")

console.log("3. Copiando logos correctos...")
fixLogos()
console.log("")

console.log("4. Eliminando iconos antiguos...")
removeOldIcons()
console.log("")

console.log("===========================================")
console.log("  COMPLETADO!")
console.log("  Ahora ejecuta:")
console.log("  npm run build:native")
console.log("  npx cap add android")
console.log("  npx cap copy android")
console.log("  npx cap sync android")
console.log("  node scripts/generate-android-icons.mjs")
console.log("  npx cap open android")
console.log("===========================================")
