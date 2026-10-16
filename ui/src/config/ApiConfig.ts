/** API base URL: the same site's /api in production builds, where the API also serves the UI, and the local API otherwise. */
const ApiConfig = {
  API_URL: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3000/api',
}

export default ApiConfig
