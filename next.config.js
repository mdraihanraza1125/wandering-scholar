/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      // Ye line Next.js ko errors ignore karke deploy karne ki permission deti hai
      ignoreDuringBuilds: true,
    },
    typescript: {
      // TypeScript errors ko bhi ignore karne ke liye
      ignoreBuildErrors: true,
    },
  }
  
  module.exports = nextConfig