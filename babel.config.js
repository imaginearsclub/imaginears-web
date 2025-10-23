export default {
  presets: ['next/babel'],
  plugins: [
    ['babel-plugin-react-compiler', {
      // React Compiler configuration
      compilationMode: 'annotation', // or 'infer' for automatic optimization
    }],
  ],
};

