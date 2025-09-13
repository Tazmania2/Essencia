/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    FUNIFIER_API_KEY: process.env.FUNIFIER_API_KEY,
    FUNIFIER_BASE_URL: process.env.FUNIFIER_BASE_URL,
  },
}

module.exports = nextConfig