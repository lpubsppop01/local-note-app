const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const LicensePack = require('license-info-webpack-plugin').default;

module.exports = function(env) {
  const MAIN = env && env.main;
  const PROD = env && env.prod;

  return {
    mode: PROD ? "production" : 'development',
    target: MAIN ? "electron-main" : "electron-renderer",
    entry: MAIN ? "./src/main/app.ts" : [ "./src/index.html", "./src/renderer/index.tsx" ],
    output: {
      filename: MAIN ? "main.js" : "renderer.js",
      path: __dirname + "/dist"
    },
    devtool: PROD ? "" : "source-map",
    node: {
      __dirname: false
    },
    resolve: {
      extensions: [ ".ts", ".tsx", ".js", ".json" ]
    },
    module: {
      rules: [
        { test: /\.tsx?$/, loader: "ts-loader" },
        { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },
        { test: /\.(html?|css)$/, loader: "file-loader?name=[name].[ext]" }
      ]
    },
    plugins: (function() {
      const p = [];
      p.push(new CopyWebpackPlugin([{
        from: 'node_modules/monaco-editor/min/vs',
        to: 'vs',
      }, {
        from: 'node_modules/vscode-ripgrep/bin',
        to: 'bin'
      }]));
      if (PROD) {
        p.push(new LicensePack({
          glob: '{LICENSE,license,License}*'
        }));
      }
      return p;
    })()
  };
};