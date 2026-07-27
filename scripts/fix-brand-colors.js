/**
 * CamareroPorFavor - Script para forzar colores de marca correctos
 * Ejecutar con: node scripts/fix-brand-colors.js
 * 
 * Colores correctos:
 *   Teal:   #01A89E
 *   Orange: #F48221
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const ROOT = process.cwd()
const EXTENSIONS = ['.tsx', '.ts', '.css', '.js', '.mjs']

// Old color patterns -> new brand colors
const REPLACEMENTS = [
  // Old blues/cyans -> Teal #01A89E
  [/#248FCC/gi, '#01A89E'],
  [/#0891b2/gi, '#01A89E'],
  [/#06b6d4/gi, '#01A89E'],
  [/#0e7490/gi, '#01A89E'],
  [/#155e75/gi, '#017A73'],
  [/#0284c7/gi, '#01A89E'],
  [/#0ea5e9/gi, '#01A89E'],
  [/#38bdf8/gi, '#33C4BC'],
  // Old oranges -> Orange #F48221
  [/#FF6900/gi, '#F48221'],
  [/#ea580c/gi, '#F48221'],
  [/#c2410c/gi, '#D06E1B'],
  [/#9a3412/gi, '#B05A15'],
]

function walkDir(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry === '.git' || entry === 'android') continue
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      files.push(...walkDir(full))
    } else if (EXTENSIONS.includes(extname(full))) {
      files.push(full)
    }
  }
  return files
}

let changed = 0
for (const file of walkDir(ROOT)) {
  let content = readFileSync(file, 'utf8')
  let original = content
  for (const [pattern, replacement] of REPLACEMENTS) {
    content = content.replace(pattern, replacement)
  }
  if (content !== original) {
    writeFileSync(file, content)
    changed++
    console.log(`Fixed: ${file.replace(ROOT, '.')}`)
  }
}

console.log(`\nDone. Fixed ${changed} file(s).`)
console.log('Brand colors: Teal #01A89E, Orange #F48221')
