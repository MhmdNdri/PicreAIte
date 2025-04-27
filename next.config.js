/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    authInterrupts: true,
  },
  images: {
    domains: ["i.ibb.co"],
  },
};

module.exports = nextConfig;
