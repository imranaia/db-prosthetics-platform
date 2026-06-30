import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow Cloudinary images in Next.js <Image> components
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },

  // Keep better-sqlite3 as a native Node.js module —
  // do NOT bundle it with the app (it has native .node bindings).
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
