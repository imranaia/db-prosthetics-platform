import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Shrink the client-side Router Cache. Every dashboard page is
  // statically prerendered, which defaults to a 5-minute (effectively
  // indefinite, since Link prefetching on scroll keeps renewing it)
  // client cache — a browser tab left open from before a deploy can
  // keep showing stale pages for a long time without ever fetching new
  // code. Next enforces a 30s floor on `static`, so that's the lowest
  // this can go.
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
  },

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
