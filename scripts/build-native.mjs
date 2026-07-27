#!/usr/bin/env node
/**
 * Cross-platform build script for Capacitor native (output: export).
 *
 * Strategy:
 * - MOVE (not stub) everything that is incompatible with output: "export":
 *   API routes, middleware, dynamic [param] routes, admin, auth callback.
 * - For remaining pages: stub only non-"use client" pages with a minimal
 *   "use client" component so they can be statically exported.
 * - For "use server" files: replace with no-op stubs.
 * - After build: restore everything.
 */

import { execSync } from "child_process"
import {
  existsSync,
  renameSync,
  rmSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  mkdirSync,
  cpSync,
} from "fs"
import { join, relative, dirname } from "path"

const ROOT = process.cwd()
const APP_DIR = join(ROOT, "app")
const BACKUP_DIR = join(ROOT, "_native_build_backup")

// ---- Storage for restoring ----
const originalFiles = new Map()  // path -> original content
const movedItems = []            // { src, dest }

// ---- Folders/files to PHYSICALLY MOVE out ----
// These are completely incompatible with output: "export"
const thingsToMove = [
  // API routes
  join(APP_DIR, "api"),
  // Auth API routes
  join(APP_DIR, "auth", "callback"),
  join(APP_DIR, "auth", "confirm"),
  // Middleware
  join(ROOT, "middleware.ts"),
  // Admin section (server layout)
  join(APP_DIR, "admin"),
  // ALL dynamic route segments - they cannot be statically exported
  join(APP_DIR, "business", "[id]"),
  join(APP_DIR, "profile", "[id]"),
  join(APP_DIR, "jobs", "[id]"),
  join(APP_DIR, "flash-offers", "[id]"),
  join(APP_DIR, "companies", "[id]"),
  join(APP_DIR, "category", "[name]"),
]

// ---- Utility: recursively find files ----
function findFiles(dir, filename) {
  const results = []
  if (!existsSync(dir)) return results
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith("_")) continue
    const full = join(dir, entry)
    try {
      const stat = statSync(full)
      if (stat.isDirectory()) {
        results.push(...findFiles(full, filename))
      } else if (entry === filename) {
        results.push(full)
      }
    } catch { /* skip */ }
  }
  return results
}

// ---- Step 1: Move incompatible things to backup dir ----
function moveIncompatible() {
  mkdirSync(BACKUP_DIR, { recursive: true })

  for (const src of thingsToMove) {
    if (!existsSync(src)) continue

    const rel = relative(ROOT, src)
    const dest = join(BACKUP_DIR, rel)

    // Ensure destination parent exists
    mkdirSync(dirname(dest), { recursive: true })

    renameSync(src, dest)
    movedItems.push({ src, dest })
    console.log(`>>> Moved out: ${rel}`)
  }
}

// ---- Step 2: Stub remaining server pages/layouts ----
function stubRemainingServerComponents() {
  const pageFiles = findFiles(APP_DIR, "page.tsx")
  const layoutFiles = findFiles(APP_DIR, "layout.tsx")

  let stubCount = 0

  // Stub server pages (only non-dynamic ones remain after moveIncompatible)
  for (const filePath of pageFiles) {
    const content = readFileSync(filePath, "utf-8")
    const trimmed = content.trimStart()

    if (trimmed.startsWith('"use client"') || trimmed.startsWith("'use client'")) {
      continue // Already a client component, safe for static export
    }

    originalFiles.set(filePath, content)
    const stub = '"use client"\n\nexport default function Page() {\n  return null\n}\n'
    writeFileSync(filePath, stub, "utf-8")
    stubCount++
    console.log(`>>> Stubbed page: ${relative(ROOT, filePath)}`)
  }

  // Stub server layouts (except root)
  for (const filePath of layoutFiles) {
    if (filePath === join(APP_DIR, "layout.tsx")) continue

    const content = readFileSync(filePath, "utf-8")
    const trimmed = content.trimStart()

    if (trimmed.startsWith('"use client"') || trimmed.startsWith("'use client'")) {
      continue
    }

    if (content.includes("createClient") || content.includes("cookies") || content.includes("redirect")) {
      originalFiles.set(filePath, content)
      const stub = 'export default function Layout({ children }: { children: React.ReactNode }) {\n  return <>{children}</>\n}\n'
      writeFileSync(filePath, stub, "utf-8")
      stubCount++
      console.log(`>>> Stubbed layout: ${relative(ROOT, filePath)}`)
    }
  }

  console.log(`>>> Stubbed ${stubCount} server components`)
}

// ---- Step 3: Stub "use server" action files ----
function stubServerActions() {
  const candidates = [
    join(ROOT, "lib", "actions.ts"),
    join(ROOT, "lib", "mapbox.ts"),
    join(ROOT, "app", "actions", "stripe.ts"),
  ]

  for (const filePath of candidates) {
    if (!existsSync(filePath)) continue
    const content = readFileSync(filePath, "utf-8")
    if (!content.trimStart().startsWith('"use server"') && !content.trimStart().startsWith("'use server'")) {
      continue
    }

    originalFiles.set(filePath, content)

    // Extract exported function names and create no-op stubs
    const funcNames = [...content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)].map(m => m[1])
    const constNames = [...content.matchAll(/export\s+(?:const|let)\s+(\w+)/g)].map(m => m[1])

    let stub = "// Stubbed for native build - no server actions\n"
    for (const name of funcNames) {
      stub += `export async function ${name}(...args) { return null }\n`
    }
    for (const name of constNames) {
      stub += `export const ${name} = null\n`
    }
    if (funcNames.length === 0 && constNames.length === 0) {
      stub += "export {}\n"
    }

    writeFileSync(filePath, stub, "utf-8")
    console.log(`>>> Stubbed server action: ${relative(ROOT, filePath)}`)
  }
}

// ---- Restore everything ----
function restore() {
  let count = 0

  // Restore stubbed files first
  for (const [filePath, content] of originalFiles) {
    writeFileSync(filePath, content, "utf-8")
    count++
  }

  // Restore moved items (reverse order)
  for (const { src, dest } of movedItems.reverse()) {
    if (existsSync(dest)) {
      // Ensure parent of src exists
      mkdirSync(dirname(src), { recursive: true })
      renameSync(dest, src)
      count++
    }
  }

  // Remove backup directory
  if (existsSync(BACKUP_DIR)) {
    rmSync(BACKUP_DIR, { recursive: true, force: true })
  }

  console.log(`>>> Restored ${count} items`)
}

// ===== MAIN =====
console.log(">>> Preparing native build (output: export)...")
console.log(`>>> Working directory: ${ROOT}`)

// Clean caches
for (const dir of [join(ROOT, ".next"), join(ROOT, "out"), join(ROOT, "node_modules", ".cache")]) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true })
    console.log(`>>> Cleaned: ${relative(ROOT, dir)}`)
  }
}

// Clean any leftover backup from a previous failed run
if (existsSync(BACKUP_DIR)) {
  console.log(">>> WARNING: Found leftover backup from previous run, cleaning up...")
  // Restore from leftover backup first
  for (const src of thingsToMove) {
    const rel = relative(ROOT, src)
    const backupPath = join(BACKUP_DIR, rel)
    if (existsSync(backupPath) && !existsSync(src)) {
      mkdirSync(dirname(src), { recursive: true })
      renameSync(backupPath, src)
      console.log(`>>> Recovered: ${rel}`)
    }
  }
  rmSync(BACKUP_DIR, { recursive: true, force: true })
}

// Execute build steps
moveIncompatible()
stubRemainingServerComponents()
stubServerActions()

console.log("")
console.log(">>> Starting next build...")
console.log("")

let failed = false
try {
  execSync("npx next build", {
    stdio: "inherit",
    env: { ...process.env, BUILD_TARGET: "native" },
  })
} catch {
  failed = true
}

console.log("")
console.log(">>> Restoring original files...")
restore()

if (failed) {
  console.error("")
  console.error(">>> Native build FAILED")
  process.exit(1)
}

console.log("")
console.log(">>> Native build completed successfully!")
console.log(`>>> Static files in: ${relative(ROOT, join(ROOT, "out"))}/`)
