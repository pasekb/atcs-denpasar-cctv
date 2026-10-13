/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'atcs.denpasarkota.go.id',
      },
    ],
  },
}

module.exports = nextConfig
