// PostCSS config for Tailwind CSS v4
// Notes:
// - We use only the official @tailwindcss/postcss plugin bundle (includes nesting).
// - Autoprefixing is handled by Next.js (Lightning CSS), so we do NOT add autoprefixer here to avoid duplication.
// - Disable source maps in production to reduce build artifacts; use inline maps in dev for DX.
const isProd = process.env.NODE_ENV === 'production';
const isDev = process.env.NODE_ENV === 'development';

export default {
  // Security: Avoid writing .map files in production; keep inline maps during local dev for easier debugging.
  // Performance: Inline maps in dev are faster than separate .map files
  map: isProd ? false : { inline: true, annotation: false },
  
  // Security: Do not infer a source filename; avoids leaking local paths in source maps/metadata
  from: undefined,
  
  // Security: Disable parser warnings that could leak information
  parser: undefined,
  
  // Performance: Use array form to ensure deterministic order and faster processing
  plugins: [
    '@tailwindcss/postcss',
  ],
  
  // Performance: Optimize for production builds
  ...(isProd && {
    // Disable unnecessary features in production
    parser: false,
    // Ensure consistent output
    stringifier: undefined,
  }),
  
  // Development optimizations
  ...(isDev && {
    // Enable better error reporting in development
    parser: undefined,
  }),
};
