/** @type {import('next').NextConfig} */
const nextConfig = {
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
