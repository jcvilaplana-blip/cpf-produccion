// This script reads every source file and rewrites it identically,
// forcing the sandbox to mark them all as modified for the current session.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const ROOT = process.cwd()
const EXTENSIONS = new Set(['.tsx', '.ts', '.css', '.mjs', '.js', '.json'])
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'android', 'ios', '.vercel'])

let count = 0

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      walk(full)
    } else if (EXTENSIONS.has(extname(entry))) {
      const content = readFileSync(full, 'utf-8')
      writeFileSync(full, content, 'utf-8')
      count++
    }
  }
}

walk(ROOT)
console.log(`Force-synced ${count} files.`)
