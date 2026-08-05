#!/usr/bin/env node
/**
 * Comprobaciones previas al build.
 *
 * Existe porque un build puede "terminar bien" y dejar la app inservible: sin
 * `.env.local` Next compila igual, pero el sitio arranca sin base de datos. Y
 * con la versión de Node equivocada el build puede fallar de formas confusas
 * (el shell de Plesk daba v18 aunque el proyecto pide 22).
 *
 * Falla ruidosamente y explica qué falta. Se ejecuta desde `npm run build`.
 */

import { existsSync, readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

const RED = "\x1b[31m"
const YELLOW = "\x1b[33m"
const GREEN = "\x1b[32m"
const RESET = "\x1b[0m"

const problems = []
const warnings = []

// --- 1. Versión de Node ------------------------------------------------------
const required = Number((readFileOrEmpty(join(ROOT, ".node-version")).trim() || "22").split(".")[0])
const current = Number(process.versions.node.split(".")[0])

if (Number.isFinite(required) && current < required) {
  problems.push(
    `Node ${process.versions.node} es demasiado antiguo: el proyecto necesita Node ${required} o superior.\n` +
    `    En Plesk, las versiones disponibles están en /opt/plesk/node/. Antes de compilar:\n` +
    `      export PATH=/opt/plesk/node/${required}/bin:$PATH`
  )
}

// --- 2. Variables de entorno -------------------------------------------------
// Next carga .env.local automáticamente al compilar, pero este script corre
// antes, así que lo leemos nosotros. Las variables ya presentes en el entorno
// (por ejemplo inyectadas por el panel) tienen prioridad.
const envFile = join(ROOT, ".env.local")
const fileEnv = parseEnv(readFileOrEmpty(envFile))
const value = (key) => (process.env[key] ?? fileEnv[key] ?? "").trim()

if (!existsSync(envFile) && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  problems.push(
    `No existe .env.local y tampoco hay variables en el entorno.\n` +
    `    Está en .gitignore, así que no viaja con el repositorio:\n` +
    `      cp .env.example .env.local   y rellena los valores`
  )
}

// Sin estas la aplicación no puede funcionar en absoluto.
const REQUIRED = [
  ["NEXT_PUBLIC_SUPABASE_URL", "la URL del proyecto Supabase"],
  ["SUPABASE_SERVICE_ROLE_KEY", "la clave de servicio (subidas, perfiles, valoraciones)"],
]
for (const [key, what] of REQUIRED) {
  if (!value(key)) problems.push(`Falta ${key} — ${what}.`)
}

// La clave pública admite dos nombres; basta con uno.
if (!value("NEXT_PUBLIC_SUPABASE_ANON_KEY") && !value("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")) {
  problems.push(
    "Falta la clave pública de Supabase: define NEXT_PUBLIC_SUPABASE_ANON_KEY " +
    "o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
  )
}

// Estas degradan funcionalidades concretas, pero no impiden arrancar.
const OPTIONAL = [
  ["NEXT_PUBLIC_APP_URL", "los enlaces de confirmación de correo y las vueltas de pago usarán una URL por defecto"],
  ["RESEND_API_KEY", "no se enviarán correos de verificación ni de recuperación"],
  ["NEXT_PUBLIC_MAPBOX_TOKEN", "los mapas no cargarán"],
  ["STRIPE_SECRET_KEY", "los pagos con Stripe no funcionarán"],
  ["STRIPE_WEBHOOK_SECRET", "el webhook de Stripe rechazará los eventos"],
  ["REDSYS_MERCHANT_CODE", "los pagos con Redsys no funcionarán"],
]
for (const [key, consequence] of OPTIONAL) {
  if (!value(key)) warnings.push(`${key} sin valor — ${consequence}.`)
}

// --- Resultado ---------------------------------------------------------------
for (const warning of warnings) {
  console.warn(`${YELLOW}  aviso:${RESET} ${warning}`)
}

if (problems.length > 0) {
  console.error(`\n${RED}==> Build abortado: faltan requisitos${RESET}\n`)
  for (const problem of problems) console.error(`${RED}  ×${RESET} ${problem}\n`)
  console.error(`Corrige lo anterior y vuelve a lanzar el build.\n`)
  process.exit(1)
}

console.log(
  `${GREEN}==> Preflight OK${RESET} (Node ${process.versions.node}, ` +
  `${warnings.length} aviso${warnings.length === 1 ? "" : "s"})`
)

// --- Utilidades --------------------------------------------------------------
function readFileOrEmpty(path) {
  try {
    return readFileSync(path, "utf-8")
  } catch {
    return ""
  }
}

function parseEnv(contents) {
  const result = {}
  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue
    const eq = line.indexOf("=")
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    result[key] = val
  }
  return result
}
