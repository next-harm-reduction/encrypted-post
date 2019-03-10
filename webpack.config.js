const CopyPlugin = require('copy-webpack-plugin');
const GitRevisionPlugin = require('git-revision-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');

const path = require('path');
const webpack = require('webpack');

const gitRevisionPlugin = new GitRevisionPlugin();

const DEFAULT_SUBMIT_URL = 'https://script.google.com/macros/s/AKfycbwe7OLOLtxAN_smlnNFyQWDqbjVVk9Vq76QwA0Cj8yiX4_SDS7Z/exec'
const DEFAULT_SPREADSHEET_ID = '1FyKBMiKmMvKu8QtHakIu0Ih1Mt0cjSD-xvvTLJdYQn0' // '1VmcE6WHkF_xWkhCiJGIBnwKF021LwnF7rkpfJlvtOOE'
const TARGET_DIR = 'dist'

module.exports = [
  {
    entry: './src/encrypt/encrypt.js',
    name: 'encrypt',
    output: {
      filename: 'main.js',
      path: path.resolve(__dirname, TARGET_DIR, 'encrypt'),
    },
    externals: {
      jsencrypt: 'JSEncrypt'
    },
    plugins: [
      new webpack.DefinePlugin({
        GITHASH: JSON.stringify(gitRevisionPlugin.commithash()),
        SUBMIT_URL: JSON.stringify(process.env.SUBMIT_URL || DEFAULT_SUBMIT_URL)
      }),
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: 'src/encrypt/encrypt.html',
        minify: false,
        inlineSource: '.js$'
      }),
      new HtmlWebpackInlineSourcePlugin()
    ],
    module: {
      rules: [
        {
          test: /key\.pub\.rsa/,
          use: 'raw-loader',
        },
      ],
    },
    target: 'web',
    mode: 'production'
  },
  {
    name: 'Google app script',
    entry: './src/encrypt/Code.gs',
    plugins: [
      new CopyPlugin([{
        from: 'src/encrypt/Code.gs',
        to: path.resolve(__dirname, TARGET_DIR, 'encrypt/Code.gs'),
        transform: (contentBuffer) => {
          const content = contentBuffer.toString('utf8')
          console.log('HIHIHI', content)
          return Buffer.from(
            content.replace(
                /SPREADSHEET_ID/,
              JSON.stringify(process.env.SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID)
            ))
        }
      }])
    ],
    mode: 'production'
  },
  {
    entry: './src/decrypt/decrypt.js',
    name: 'decrypt',
    output: {
      filename: 'main.js',
      path: path.resolve(__dirname, TARGET_DIR, 'decrypt'),
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: 'src/decrypt/decrypt.html',
        minify: false
      }),
    ],
    target: 'web',
    mode: 'production'
  },
];
