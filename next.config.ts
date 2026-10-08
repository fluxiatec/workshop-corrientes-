import type { NextConfig } from "next";

// En GitHub Pages el sitio vive en /nombre-del-repo (lo define el workflow).
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // Sitio 100% estático (carpeta `out/`): GitHub Pages, Cloudflare Pages, Netlify, etc.
  output: "export",
  basePath: basePath || undefined,
  images: { unoptimized: true },
  poweredByHeader: false,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
