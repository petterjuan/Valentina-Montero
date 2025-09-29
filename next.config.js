/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
    ],
  },
  typescript: {
    // Ignorar errores de TypeScript durante el build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignorar errores de ESLint durante el build
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
