/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    domains: ['lh3.googleusercontent.com', 'graph.microsoft.com'],
  },
};

module.exports = nextConfig;