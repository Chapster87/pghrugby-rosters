import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Static HTML export for DreamHost shared hosting (no Node server)
  output: "export",
  // Needed so routes map cleanly to /path/index.html on Apache
  trailingSlash: true,
  // next/image optimization requires a server; disable for static hosting
  images: {
    unoptimized: true,
  },
}

export default nextConfig
