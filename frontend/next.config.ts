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
  // The RabbitMQ client is plain Node code: load it as it is instead of bundling it.
  serverExternalPackages: ["amqplib"],
  // Static shell + streamed data: the frame of every page is prerendered once, and only what a page
  // reads from the Training service is fetched per request (inside <Suspense>).
  cacheComponents: true,
  // `next dev` would otherwise write AGENTS.md / CLAUDE.md into the project.
  agentRules: false,
};

export default nextConfig;
