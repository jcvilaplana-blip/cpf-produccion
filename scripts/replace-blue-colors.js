const fs = require('fs')
const path = require('path')

const replacements = [
  // Exact hex colors
  ['#358DCD', '#01A89E'],
  ['#358dcd', '#01A89E'],
  ['#3D93BB', '#01A89E'],
  ['#3d93bb', '#01A89E'],
  
  // Tailwind sky -> teal equivalents
  ['bg-sky-500', 'bg-[#01A89E]'],
  ['bg-sky-600', 'bg-[#018F86]'],
  ['bg-sky-400', 'bg-[#01A89E]'],
  ['bg-sky-100', 'bg-teal-100'],
  ['bg-sky-50', 'bg-teal-50'],
  ['bg-sky-900/40', 'bg-teal-900/40'],
  ['bg-sky-900', 'bg-teal-900'],
  ['bg-sky-950', 'bg-teal-950'],
  
  ['hover:bg-sky-500', 'hover:bg-[#01A89E]'],
  ['hover:bg-sky-600', 'hover:bg-[#018F86]'],
  ['hover:bg-sky-700', 'hover:bg-[#017A73]'],
  ['hover:bg-sky-100', 'hover:bg-teal-100'],
  ['hover:bg-sky-50', 'hover:bg-teal-50'],
  
  ['text-sky-500', 'text-[#01A89E]'],
  ['text-sky-600', 'text-[#01A89E]'],
  ['text-sky-700', 'text-[#018F86]'],
  ['text-sky-400', 'text-[#01A89E]'],
  
  ['hover:text-sky-600', 'hover:text-[#018F86]'],
  ['hover:text-sky-700', 'hover:text-[#017A73]'],
  
  ['border-sky-500', 'border-[#01A89E]'],
  ['border-sky-600', 'border-[#018F86]'],
  ['border-sky-200', 'border-teal-200'],
  ['border-sky-300', 'border-teal-300'],
  ['border-sky-100', 'border-teal-100'],
  
  ['from-sky-500', 'from-[#01A89E]'],
  ['from-sky-600', 'from-[#018F86]'],
  ['from-sky-400', 'from-[#01A89E]'],
  ['from-sky-50', 'from-teal-50'],
  ['from-sky-100', 'from-teal-100'],
  
  ['to-sky-500', 'to-[#01A89E]'],
  ['to-sky-600', 'to-[#018F86]'],
  ['to-sky-700', 'to-[#017A73]'],
  ['to-sky-400', 'to-[#01A89E]'],
  
  ['ring-sky-500', 'ring-[#01A89E]'],
  ['ring-sky-600', 'ring-[#018F86]'],
  
  ['focus:ring-sky-500', 'focus:ring-[#01A89E]'],
  ['focus-visible:ring-sky-500', 'focus-visible:ring-[#01A89E]'],
  
  // Blue variants
  ['bg-blue-500', 'bg-[#01A89E]'],
  ['bg-blue-600', 'bg-[#018F86]'],
  ['bg-blue-50', 'bg-teal-50'],
  ['bg-blue-100', 'bg-teal-100'],
  ['bg-blue-950', 'bg-teal-950'],
  ['bg-blue-900', 'bg-teal-900'],
  
  ['hover:bg-blue-500', 'hover:bg-[#01A89E]'],
  ['hover:bg-blue-600', 'hover:bg-[#018F86]'],
  ['hover:bg-blue-700', 'hover:bg-[#017A73]'],
  
  ['text-blue-500', 'text-[#01A89E]'],
  ['text-blue-600', 'text-[#01A89E]'],
  ['text-blue-700', 'text-[#018F86]'],
  
  ['border-blue-500', 'border-[#01A89E]'],
  ['border-blue-200', 'border-teal-200'],
  ['border-blue-300', 'border-teal-300'],
  
  ['from-blue-500', 'from-[#01A89E]'],
  ['from-blue-600', 'from-[#018F86]'],
  ['to-blue-500', 'to-[#01A89E]'],
  ['to-blue-600', 'to-[#018F86]'],
  ['to-blue-700', 'to-[#017A73]'],
]

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8')
  let changed = false
  
  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.replaceAll(from, to)
      changed = true
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content)
    console.log(`Updated: ${filePath}`)
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git' || entry.name === 'android') continue
      walkDir(fullPath)
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts') || entry.name.endsWith('.css')) {
      replaceInFile(fullPath)
    }
  }
}

// Find project root by looking for package.json
function findProjectRoot(startDir) {
  let dir = startDir
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  // Fallback to known paths
  const candidates = ['/vercel/path0', '/vercel/share/v0-project', process.cwd()]
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'components'))) return c
  }
  return process.cwd()
}

const projectRoot = findProjectRoot(process.cwd())
console.log('Project root:', projectRoot)

const compDir = path.join(projectRoot, 'components')
const appDir = path.join(projectRoot, 'app')

if (fs.existsSync(compDir)) walkDir(compDir)
else console.log('components dir not found at', compDir)

if (fs.existsSync(appDir)) walkDir(appDir)
else console.log('app dir not found at', appDir)

console.log('Done! All blue colors replaced with teal #01A89E')
