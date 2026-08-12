import { defineConfig } from "orval";

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
