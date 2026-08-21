import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a static `out/` folder (`next build`) instead of a Node
  // server, since GitHub Pages only serves static files.
  output: "export",
  // Next's built-in image optimization runs on a server, which GitHub
  // Pages doesn't have — this serves images as-is instead.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
