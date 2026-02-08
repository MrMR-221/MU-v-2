/** @type {import('next').NextConfig} */
const nextConfig = {
    // Prevent Webpack from bundling these packages
    experimental: {
        serverComponentsExternalPackages: ['@lancedb/lancedb', 'onnxruntime-node', '@xenova/transformers'],
    },
    webpack: (config) => {
        config.externals = [...(config.externals || []), 'onnxruntime-node'];
        return config;
    },
};

export default nextConfig;
