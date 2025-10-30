import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
    // Security: Enable React Strict Mode for better error detection and security
    reactStrictMode: true,
    
    // Performance: Produce a self-contained .next/standalone output that's easier to deploy in Docker/serverless
    output: "standalone",

    // Performance & Security: Optimize images
    images: {
        formats: ['image/webp', 'image/avif'],
        minimumCacheTTL: 31536000, // 1 year
        dangerouslyAllowSVG: false, // Security: Disable SVG by default
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
    
    // Turbopack: Empty config to enable Turbopack (Next.js 16 default)
    turbopack: {},
    
    // Performance: Enable optimized package imports
    experimental: { 
        optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts']
    },
    
    // Performance: External packages for server components (moved from experimental)
    serverExternalPackages: ['@prisma/client', 'bcryptjs'],
    
    // Security: Configure security headers
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin'
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://challenges.cloudflare.com https://*.sentry.io; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self';"
                    }
                ]
            }
        ];
    },
    
    // Performance: Enable compression
    compress: true,
    
    // Security: Disable powered by header
    poweredByHeader: false,
    
    // Performance: Optimize bundle (only when not using Turbopack)
    ...(process.env['TURBOPACK'] !== '1' && {
        webpack: (config, { dev, isServer }) => {
            // Performance: Optimize for production
            if (!dev && !isServer) {
                config.optimization.splitChunks = {
                    chunks: 'all',
                    cacheGroups: {
                        vendor: {
                            test: /[\\/]node_modules[\\/]/,
                            name: 'vendors',
                            chunks: 'all',
                        },
                    },
                };
            }
            
            return config;
        },
    }),
    
    // Security & Monitoring: Enable source maps for Sentry error tracking
    productionBrowserSourceMaps: true,
    
    // Performance: Enable experimental features for better performance
    ...(process.env.NODE_ENV === 'development' && {
        // Performance: Enable faster refresh in development
        onDemandEntries: {
            maxInactiveAge: 25 * 1000,
            pagesBufferLength: 2,
        },
    })
};

// Wrap the config with Sentry
export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "imaginears-club",

  project: "imaginears-web",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true
});