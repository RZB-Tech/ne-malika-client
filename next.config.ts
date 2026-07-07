import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the dev server to be reached through tunnels (e.g. ngrok) without
  // the cross-origin HMR warning.
  allowedDevOrigins: ["*.ngrok-free.dev", "*.ngrok.io", "*.trycloudflare.com"],
  // Lets an isolated production build write to a separate folder so it doesn't
  // clash with a running `next dev` server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
