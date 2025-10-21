// PostCSS config for Tailwind CSS v4
// Notes:
// - We use only the official @tailwindcss/postcss plugin bundle (includes nesting).
// - Autoprefixing is handled by Next.js (Lightning CSS), so we do NOT add autoprefixer here to avoid duplication.
// - Disable source maps in production to reduce build artifacts; use inline maps in dev for DX.
const isProd = process.env.NODE_ENV === 'production';

export default {
  // Avoid writing .map files in production; keep inline maps during local dev for easier debugging.
  map: isProd ? false : { inline: true, annotation: false },
  // Do not infer a source filename; avoids leaking local paths in source maps/metadata
  from: undefined,
  // Use array form to ensure deterministic order
  plugins: [
    '@tailwindcss/postcss',
  ],
};
