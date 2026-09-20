import path from "node:path";
import type { NextConfig } from "next";

const appRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  // Self-contained server bundle (.next/standalone) for the Docker image.
  output: "standalone",
  // The repository root also holds a package-lock.json, which makes Next guess the
  // wrong workspace root (and nest the standalone server under frontend/).
  // Pin it to this app.
  turbopack: { root: appRoot },
  outputFileTracingRoot: appRoot,
  poweredByHeader: false,
};

export default nextConfig;
