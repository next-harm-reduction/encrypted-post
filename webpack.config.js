const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
// const webpack = require('webpack');

module.exports = {
  entry: {
    encrypt: './src/encrypt.js',
    decrypt: './src/decrypt.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new HtmlWebpackPlugin(),
  ],
  target: 'web',
  watch: true,
};
