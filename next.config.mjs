import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

// Declarado antes de `nextConfig` porque este ya lo consulta más abajo.
const env = typeof process !== 'undefined' ? process.env : {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // El servidor tiene un package-lock.json vacío en el directorio padre
  // (/var/www/vhosts/fullstark.es/), y Next lo tomaba por la raíz del
  // proyecto: "We detected multiple lockfiles and selected the directory of
  // ... as the root directory". Eso desvía el file tracing del build. Se fija
  // aquí en lugar de borrar un fichero ajeno en un servidor compartido.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // El proyecto está en 0 errores. Se deja la comprobación activa para que
    // el build falle si vuelven a aparecer: los 49 que había acumulados
    // escondían bugs reales (una especialidad que se borraba al guardar, un
    // mapa que se quedaba sin marcadores, un botón de entrevista roto), y
    // pasaban desapercibidos precisamente porque el build los ignoraba.
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  generateBuildId: () => Date.now().toString(),
  // La fase "Collecting page data" lanza un proceso por núcleo, y cada uno
  // carga la aplicación entera. El servidor de desarrollo tiene 8 núcleos pero
  // sólo ~2 GB libres y NADA de swap, así que el sistema mataba a esos
  // procesos y Next lo reportaba como un desconcertante
  // "ENOENT: pages-manifest.json" que no tiene nada que ver con la causa real.
  // Se limita sólo donde hace falta, vía variable de entorno, para no ralentizar
  // los builds en máquinas que sí van holgadas de memoria.
  ...(env['NEXT_BUILD_CPUS']
    ? { experimental: { cpus: Number(env['NEXT_BUILD_CPUS']) } }
    : {}),
  async headers() {
    return [
      {
        source: '/.well-known/assetlinks.json',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
      {
        source: '/.well-known/apple-app-site-association',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
    ]
  },
  webpack: (config) => {
    config.infrastructureLogging = {
      ...config.infrastructureLogging,
      level: 'error',
    }
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        message: /Serializing big strings/,
      },
    ]
    return config
  },
}

if (env['BUILD_TARGET'] === 'native') {
  nextConfig.output = 'export'
}

export default nextConfig
