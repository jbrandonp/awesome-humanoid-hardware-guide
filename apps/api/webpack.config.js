const { join } = require('path');
const nodeExternals = require('webpack-node-externals');
const { IgnorePlugin } = require('webpack');

module.exports = {
  target: 'node',
  mode: process.env.NODE_ENV || 'development',
  entry: './src/main.ts',
  output: {
    path: join(__dirname, 'dist'),
    filename: 'main.js',
    clean: true,
  },
  externals: [nodeExternals({
    allowlist: ['@systeme-sante/models', '@systeme-sante/insurance-engine', '@systeme-sante/cornerstone-integration']
  })],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@systeme-sante/models': join(__dirname, '../../libs/models/src'),
      '@systeme-sante/insurance-engine': join(__dirname, '../../libs/insurance-engine/src'),
      '@systeme-sante/cornerstone-integration': join(__dirname, '../../libs/cornerstone-integration/src'),
    },
  },
  plugins: [
    new IgnorePlugin({
      resourceRegExp: /^(kafkajs|mqtt|nats|amqplib|amqp-connection-manager|@grpc\/grpc-js|@grpc\/proto-loader|bufferutil|utf-8-validate)$/,
    }),
  ],
  stats: 'errors-only',
};