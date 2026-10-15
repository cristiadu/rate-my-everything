import { defineConfig } from 'orval'

/** Generates the typed API client and models from the API's OpenAPI document. */
export default defineConfig({
  api: {
    input: '../api/openapi.yaml',
    output: {
      target: 'src/api/generated/api.ts',
      client: 'fetch',
      mode: 'single',
      override: {
        mutator: { path: 'src/config/ApiService.ts', name: 'apiFetch' },
        fetch: { includeHttpResponseReturnType: false },
        enumGenerationType: 'enum',
      },
    },
  },
})
