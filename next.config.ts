import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      {
        source: '/', // Jika pengunjung mengakses path ini...
        destination: '/home', // ...langsung alihkan ke path ini.
        permanent: true, // Beri tahu browser & Google bahwa ini permanen (baik untuk SEO)
      },
    ]
  },
};

export default nextConfig;
