import { defineConfig } from "orval";

// Generates a fully-typed API client + TanStack Query hooks for every backend
// endpoint. Refresh the spec with:
//   curl -s http://localhost:3001/api/v1/docs-json -o openapi/nemalika.json
// then run: pnpm gen:api
export default defineConfig({
  nemalika: {
    input: {
      target: "./openapi/nemalika.json",
    },
    output: {
      mode: "tags-split",
      target: "./lib/api/generated/endpoints",
      schemas: "./lib/api/generated/schemas",
      client: "react-query",
      httpClient: "axios",
      clean: true,
      override: {
        mutator: {
          path: "./lib/api/mutator.ts",
          name: "customInstance",
        },
      },
    },
  },
});
