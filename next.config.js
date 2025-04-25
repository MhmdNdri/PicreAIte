/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    authInterrupts: true,
  },
};

module.exports = nextConfig;
