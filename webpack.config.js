const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = [
  {
    entry: './src/encrypt/encrypt.js',
    name: 'encrypt',
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'dist/encrypt'),
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: 'src/encrypt/encrypt.html',
      }),
    ],
    target: 'web',
  },
  {
    entry: './src/decrypt/decrypt.js',
    name: 'decrypt',
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'dist/decrypt'),
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: 'src/decrypt/decrypt.html',
      }),
    ],
    target: 'web',
  },
];
