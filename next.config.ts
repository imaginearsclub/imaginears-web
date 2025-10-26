import type { NextConfig } from "next";

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
                        value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://challenges.cloudflare.com; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self';"
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
    
    // Security: Environment-specific configurations
    ...(process.env.NODE_ENV === 'production' && {
        // Security: Disable source maps in production
        productionBrowserSourceMaps: false,
    }),
    
    // Performance: Enable experimental features for better performance
    ...(process.env.NODE_ENV === 'development' && {
        // Performance: Enable faster refresh in development
        onDemandEntries: {
            maxInactiveAge: 25 * 1000,
            pagesBufferLength: 2,
        },
    })
};

export default nextConfig;
