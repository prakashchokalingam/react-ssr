import fs from 'fs';
import path from 'path';
import webpack from 'webpack';
import { smart as merge } from 'webpack-merge';
import TerserPlugin from 'terser-webpack-plugin';
import {
  hasUserBabelrc,
  getBabelrc,
  getBabelRule,
} from './helpers';

const cwd = process.cwd();
const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';

const prodConfig: webpack.Configuration = {
  performance: {
    hints: 'warning',
  },
  output: {
    pathinfo: false,
  },
  optimization: {
    namedModules: false,
    namedChunks: false,
    flagIncludedChunks: true,
    occurrenceOrder: true,
    sideEffects: true,
    usedExports: true,
    concatenateModules: true,
    splitChunks: {
      minSize: 30000,
      maxAsyncRequests: 5,
      maxInitialRequests: 3,
    },
    minimize: true,
    minimizer: [
      new TerserPlugin(),
    ],
  },
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin(),
  ],
};

const getUserWebpack = () => {
  const userConfigPath = path.join(cwd, 'ssr.config.js');
  if (fs.existsSync(userConfigPath)) {
    return require(userConfigPath).webpack;
  } else {
    return undefined;
  }
};

export const configure = (entry: webpack.Entry, cacheDir: string): webpack.Configuration => {
  if (env === 'development') {
    if (hasUserBabelrc()) {
      console.log(`[ info ] custom babelrc in: ${getBabelrc()}`);
    }
  }

  let config: webpack.Configuration = {
    mode: 'development',
    context: cwd,
    entry,
    output: {
      path: path.join(cwd, cacheDir, env),
      filename: '[name].js',
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    module: {
      rules: [
        getBabelRule(),
      ],
    },
    optimization: {
      nodeEnv: 'production',
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
    ],
  };

  if (env === 'production') {
    config = merge(config, prodConfig);
  }

  const userWebpack = getUserWebpack();
  if (userWebpack) {
    if (typeof userWebpack === 'function') {
      config = userWebpack(config, env);
    } else {
      console.warn('[ warn ] ssr.config.js#webpack must be a function');
    }
  }

  return config;
};