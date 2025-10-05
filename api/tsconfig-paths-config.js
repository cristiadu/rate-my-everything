/**
 * This file is used to register path mappings for the compiled JavaScript code
 */
const { register } = require('tsconfig-paths');

register({
  baseUrl: './dist',
  paths: {
    '@/*': ['*']
  }
});