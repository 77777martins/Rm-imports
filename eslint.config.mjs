import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Variáveis prefixadas com "_" são descartes intencionais.
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "no-console": ["warn", { allow: ["info", "warn", "error"] }],
      eqeqeq: ["error", "always"],
    },
  },
  {
    // Seed e testes rodam fora do Next: console é a saída esperada.
    files: ["prisma/**", "tests/**", "e2e/**"],
    rules: { "no-console": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "src/generated/**", "coverage/**", "playwright-report/**", "test-results/**"]),
]);

export default eslintConfig;
