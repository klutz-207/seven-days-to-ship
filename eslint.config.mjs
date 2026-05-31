import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "node_modules/**",
      "src-tauri/target/**",
      "backup/**",
      "backup_20260530/**",
      "**/*.bak",
      "**/*.tsbuildinfo",
    ],
  },
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      "react-hooks/immutability": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default eslintConfig;
