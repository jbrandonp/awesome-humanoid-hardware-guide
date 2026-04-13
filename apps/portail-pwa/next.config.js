/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3000/api/:path*",
      },
    ];
  },
  experimental: {
    esmExternals: 'loose',
    externalDir: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.experiments = {
        ...config.experiments,
        syncWebAssembly: true,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
