/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.berrydesign.com.ar',
      },
    ],
  },
};

export default nextConfig;
