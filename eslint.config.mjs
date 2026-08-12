import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Изолированные сборки (NEXT_DIST_DIR) — тот же вывод сборщика, только в
    // другой папке: без этой строки линтер разбирает минифицированные чанки и
    // выдаёт тысячи ошибок в чужом коде.
    ".next-*/**",
  ]),
]);

export default eslintConfig;
