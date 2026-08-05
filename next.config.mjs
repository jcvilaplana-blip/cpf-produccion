import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

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
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  generateBuildId: () => Date.now().toString(),
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

const env = typeof process !== 'undefined' ? process.env : {}
if (env['BUILD_TARGET'] === 'native') {
  nextConfig.output = 'export'
}

export default nextConfig
