import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextCoreWebVitals,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "@next/next/no-page-custom-font": "off",
      "react-hooks/exhaustive-deps": "warn"
    }
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "tests/**"]),
]);
