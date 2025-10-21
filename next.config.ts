import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    // Produce a self-contained .next/standalone output that's easier to deploy in Docker/serverless
    output: "standalone",
    experimental: { reactCompiler: true }
};

export default nextConfig;
