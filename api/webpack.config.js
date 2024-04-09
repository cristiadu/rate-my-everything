const path = require("path")
const CopyWebpackPlugin = require('copy-webpack-plugin')
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  target: 'node', // This is important for backend development
  entry: "./index.ts", // Entry point of your application
  plugins: [
    // new BundleAnalyzerPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        { from: '../public/images', to: 'images' },
        { from: '../public/manifest.json', to: 'manifest.json' },
        { from: '../public/robots.txt', to: 'robots.txt' },
        { from: '../public/favicon.ico', to: 'favicon.ico' },
      ]
    }),
  ],
  output: {
    filename: "bundle.js", // Output bundle file name
    path: path.resolve(__dirname, "../public-api"), // Output directory
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        exclude: [/node_modules/, /src\/test\//],
        use: {
          loader: "babel-loader",
          options: {
            presets: [["@babel/preset-env", { modules: false }], "@babel/preset-typescript"],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: [".js", ".ts"],
  },
}
