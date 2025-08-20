/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  transpilePackages: ['@lunariscloud/ui', '@lunariscloud/types'],
}

module.exports = nextConfig
