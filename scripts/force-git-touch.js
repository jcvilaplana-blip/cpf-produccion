// Script to remove brand comments from all files
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()

const PATTERNS = [
  /^\/\/ CamareroPorFavor v1\.0 Brand: #01A89E #F48221\n/,
  /^\/\/ CamareroPorFavor v1\.0\.0 - Brand: #01A89E #F48221\n/,
  /^\/\/ CamareroPorFavor Top Navigation - Brand colors: #01A89E \(teal\) #F48221 \(orange\)\n/,
  /^\/\/ CamareroPorFavor Landing - Brand colors: #01A89E \(teal\) #F48221 \(orange\)\n/,
  /^\/\/ CamareroPorFavor Bottom Navigation - Brand colors: #01A89E \(teal\) #F48221 \(orange\)\n/,
  /^\/\* CamareroPorFavor v1\.0\.0 - Brand: #01A89E teal, #F48221 orange \*\/\n/,
]

function walkDir(dir, exts) {
  const results = []
  try {
    for (const file of readdirSync(dir)) {
      const full = join(dir, file)
      const stat = statSync(full)
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'out') {
        results.push(...walkDir(full, exts))
      } else if (exts.some(ext => file.endsWith(ext))) {
        results.push(full)
      }
    }
  } catch (e) {}
  return results
}

let count = 0
const dirs = [join(ROOT, 'components'), join(ROOT, 'app'), join(ROOT, 'hooks'), join(ROOT, 'lib')]

for (const dir of dirs) {
  for (const file of walkDir(dir, ['.tsx', '.ts', '.css'])) {
    const content = readFileSync(file, 'utf8')
    let newContent = content
    for (const pattern of PATTERNS) {
      newContent = newContent.replace(pattern, '')
    }
    if (newContent !== content) {
      writeFileSync(file, newContent, 'utf8')
      count++
      console.log('Cleaned:', file.replace(ROOT, ''))
    }
  }
}

console.log(`\nDone! Removed brand comments from ${count} files.`)
