import { resolve as _resolve, join } from 'path'
import { fileURLToPath } from 'url'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin'

const __filename = fileURLToPath(import.meta.url)
const __dirname = _resolve(__filename, '..')

const config = {
  entry: './src/index.tsx',
  mode: 'development',
  plugins: [
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
  ],
  output: {
    filename: 'bundle.js',
    path: _resolve(__dirname, 'dist'),
  },
  module: {
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
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: _resolve(__dirname, './tsconfig.json')
      })
    ],
  },
  devServer: {
    historyApiFallback: true,
    static: join(__dirname, 'public'),
    port: 3000,
    open: true,
    hot: true,
  }
}

export default config
