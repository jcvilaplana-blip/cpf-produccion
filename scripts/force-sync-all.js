import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const ROOT = '/vercel/share/v0-project'
const EXTENSIONS = new Set(['.tsx', '.ts', '.css', '.mjs', '.js', '.json'])
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'android', 'ios', '.vercel', 'scripts'])

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
