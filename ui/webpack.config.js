import { resolve as _resolve, join } from 'path'
import { fileURLToPath } from 'url'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import CopyWebpackPlugin from 'copy-webpack-plugin'

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = _resolve(__filename, '..')

export const entry = './src/index.tsx'
export const plugins = [
  new HtmlWebpackPlugin({
    template: 'public/index.html',
  }),
  new CopyWebpackPlugin({
    patterns: [
      { from: 'public/images', to: 'images' },
      { from: 'public/manifest.json', to: 'manifest.json' },
      { from: 'public/robots.txt', to: 'robots.txt' },
      { from: 'public/favicon.ico', to: 'favicon.ico' },
    ],
  }),
]
export const output = {
  filename: 'bundle.js', // Output bundle file name
  path: _resolve(__dirname, 'dist'), // Output directory
}
export const module = {
  rules: [
    {
      test: /\.(js|jsx|ts|tsx)$/,
      exclude: [/node_modules/, /src\/test\//, /src\/stories\//, /src\/setupTests.ts/],
      use: {
        loader: 'babel-loader',
        options: {
          presets: [['@babel/preset-env', { modules: false }], '@babel/preset-react', '@babel/preset-typescript'],
        },
      },
    },
  ],
}
export const resolve = {
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
}
export const devServer = {
  historyApiFallback: true,
  static: join(__dirname, 'public'), // Serve files from this directory
  port: 3000, // Port for the development server
  open: true, // Open the default web browser when the server starts
  hot: true,
}
