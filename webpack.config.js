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
const PUBLIC_KEY_FILE = process.env.PUBLIC_KEY_FILE || './rsa_2048_pub.pem'
const PRIVATE_KEY_FILE = process.env.PRIVATE_KEY_FILE || ''

function resolveReplacementPlugin(namedPath, replacementPath) {
  /// This is all a bit hairy, but basically the 
  /// resolve: and module: sections below are to replace PUBLIC_KEY_FILE import
  /// with the public key file path set in an environment variable.
  /// There is probably a Better Way (TM)
  return {
    resolver: { 
        apply: (resolver) => {
          var target = resolver.ensureHook("undescribed-raw-file");
          resolver.getHook("parsed-resolve")
            .tapAsync("foo", (request, resolveContext, callback) => {
              if (request.request === namedPath) {
                var dirPath = request.path;
                var obj = Object.assign({}, request, {
                  path: path.resolve(dirPath, '../..', replacementPath),
                });
                resolver.doResolve(target, obj, "using path: " + replacementPath, resolveContext, callback);
              } else {
                callback()
              }
            })
        }
    },
    moduleRawRule: {
      test: (file) => (file === path.resolve(__dirname, replacementPath)),
      use: 'raw-loader',
    }
  }
}

const publicKeyPlugin = resolveReplacementPlugin('PUBLIC_KEY_FILE', PUBLIC_KEY_FILE)
const privateKeyPlugin = resolveReplacementPlugin('PRIVATE_KEY_FILE', PRIVATE_KEY_FILE)

function encryptor(filename, distDir, extraHtml, externals) {
  filename = filename || 'index.html'
  distDir = distDir || 'encrypt'
  extraHtml = extraHtml || ''
  externals = externals || { jsencrypt: 'JSEncrypt' }
  return {
    entry: './src/encrypt/encrypt.js',
    name: 'encrypt',
    output: {
      filename: 'main.js',
      path: path.resolve(__dirname, TARGET_DIR, distDir),
    },
    externals: externals,
    plugins: [
      new webpack.DefinePlugin({
        GITHASH: JSON.stringify(gitRevisionPlugin.commithash()),
        SUBMIT_URL: JSON.stringify(process.env.SUBMIT_URL || DEFAULT_SUBMIT_URL),
        PUBLIC_KEY_FILE: JSON.stringify(PUBLIC_KEY_FILE),
      }),
      new HtmlWebpackPlugin({
        filename: filename,
        template: 'src/encrypt/encrypt.html',
        minify: false,
        inlineSource: '.js$',
        templateParameters: {
          extraHtml: extraHtml
        }
      }),
      new HtmlWebpackInlineSourcePlugin()
    ],
    resolve: {
      plugins: [publicKeyPlugin.resolver]
    },
    module: {
      rules: [publicKeyPlugin.moduleRawRule]
    },
    optimization: {
      minimize: false
    },
    target: 'web',
    mode: 'production'
  }
}

const plannedExports = [
  encryptor(),
  {
    name: 'Google app script',
    entry: './src/encrypt/Code.gs',
    plugins: [
      new CopyPlugin([{
        from: 'src/encrypt/Code.gs',
        to: path.resolve(__dirname, TARGET_DIR, 'encrypt/Code.gs'),
        transform: (contentBuffer) => {
          const content = contentBuffer.toString('utf8')
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
];

if (PRIVATE_KEY_FILE) {
  plannedExports.push({
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
      new CopyPlugin([{
        from: 'node_modules/datatables.net-dt/css/jquery.dataTables.min.css',
        to: path.resolve(__dirname, TARGET_DIR, 'decrypt/'),
      }])
    ],
    resolve: {
      plugins: [privateKeyPlugin.resolver]
    },
    module: {
      rules: [privateKeyPlugin.moduleRawRule]
    },
    optimization: {
      minimize: false
    },
    target: 'web',
    mode: 'production'
  })
  plannedExports.push(encryptor(
    'test.html', 'decrypt',
    /* extraHtml */
    '<h2>Responses</h2><table id="results"></table>'
      + '<a id="csvanonymous" href="">Download Anonymized CSV</a>'
      + '<script src="./main.js"></script>'
      + '<script>setTimeout(function(){encryptDestination.sendFormResponse = decryptOneRow},500)</script>',
    {}
  ))
}

module.exports = plannedExports
