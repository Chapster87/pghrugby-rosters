import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Static HTML export for production (DreamHost shared hosting, no Node
  // server; Apache rewrites unknown /roster/<uuid>/ paths onto the template).
  // Dev keeps output off so the dev server serves dynamic routes natively —
  // with "output: export" it rejects any /roster/<uuid>/ URL that isn't the
  // nil-UUID template ("missing param in generateStaticParams()").
  output: process.env.NODE_ENV === "production" ? "export" : undefined,
  // Needed so routes map cleanly to /path/index.html on Apache
  trailingSlash: true,
  // next/image optimization requires a server; disable for static hosting
  images: {
    unoptimized: true,
  },
}

export default nextConfig
