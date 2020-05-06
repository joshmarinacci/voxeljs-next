const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const isLibrary = !!process.env.LIBRARY


let config;
if (isLibrary) {
  console.log("Building for library")
  config = {
    entry: {
      'voxeljs-next': path.join(__dirname, "src/index.js"),
    },
    plugins:[
      new CleanWebpackPlugin(),
    ],
    externals: {
      three: {
        commonjs: 'three',
        commonjs2: 'three',
        amd: 'three',
      },
      ecsy: {
        commonjs: 'ecsy',
        commonjs2: 'ecsy',
        amd: 'ecsy',
      },
      'ecsy-three': {
        commonjs: 'ecsy-three',
        commonjs2: 'ecsy-three',
        amd: 'ecsy-three',
      },
    }
  }
} else {
  config = {
    entry: {
      'voxeljs-next': path.join(__dirname, "src/index.js"),
      'app': path.join(__dirname, "examples/src/index.js"),
    },
    plugins:[
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({ title: 'Output', template: 'examples/public/index.html', inject: true}),
      new CopyPlugin([
        { from: path.join(__dirname, 'examples/public'), to: path.resolve(__dirname, 'dist') },
      ]),
    ],
  }
}

module.exports = ['source-map'].map(devtool => ({
  mode: 'development',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },

  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
    ],
  },

  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },

  devtool,
  ...config
}));
