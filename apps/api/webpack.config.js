const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  externals: ({ context, request }, callback) => {
    // Don't externalize workspace packages (@systeme-sante/*), bundle them
    if (request && (request.startsWith('@systeme-sante/') || 
                   request === '@systeme-sante/models' ||
                   request === '@systeme-sante/insurance-engine' ||
                   request === '@systeme-sante/cornerstone-integration')) {
      return callback(null, false);
    }
    // Externalize node_modules (non-workspace packages)
    if (request && /^[@a-zA-Z]/.test(request) && !request.startsWith('.')) {
      return callback(null, 'commonjs ' + request);
    }
    callback();
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      sourceMap: true,
    }),
  ],
};
