const createNextIntlPlugin = require('next-intl/plugin')
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
 
const withNextIntl = createNextIntlPlugin('./i18n.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Azure Static Web Apps
  output: 'export',
  trailingSlash: true,
  
  transpilePackages: ['@mozedu/ui', '@mozedu/types'],
  
  images: {
    // Disable Image Optimization for static export
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

module.exports = withBundleAnalyzer(withNextIntl(nextConfig))
