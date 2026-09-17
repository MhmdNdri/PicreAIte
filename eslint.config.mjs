import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "coverage/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Keep existing cleanup/type debt visible without blocking the first lint
    // baseline. Correctness checks (including React Hooks) remain errors.
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
  {
    files: ["*.config.js"],
    // These configuration files use CommonJS, as required by their current setup.
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
];

export default config;
