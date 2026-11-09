import js from "@eslint/js";
import tseslint from "typescript-eslint";
import { importX } from "eslint-plugin-import-x";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import globals from "globals";

const browserStorage = ["localStorage", "sessionStorage"].map((name) => ({
  name,
  message: "Only src/storage reads and writes the browser storage.",
}));

export default tseslint.config(
  { ignores: ["dist", "node_modules", ".claude", "coverage"] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  importX.flatConfigs.typescript,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    settings: {
      "import-x/resolver-next": [
        createTypeScriptImportResolver({ project: "./tsconfig.*.json", noWarnOnMultipleProjects: true }),
      ],
    },
    rules: {
      "import-x/no-cycle": "error",
    },
  },
  {
    files: ["*.js"],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
  // Helper scripts run with Node on the laptop, outside the app's layers.
  {
    files: ["scripts/**/*.ts"],
    languageOptions: { globals: globals.node },
  },
  // Layer rules (docs/architecture.md): ui → storage → core, ui → core
  {
    files: ["src/core/**/*.ts"],
    ignores: ["src/core/**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["**/storage/**", "**/storage"], message: "core must not import from storage." },
            { group: ["**/ui/**", "**/ui"], message: "core must not import from ui." },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        ...["window", "document", "localStorage", "sessionStorage", "navigator"].map((name) => ({
          name,
          message: "core must not use browser objects.",
        })),
      ],
    },
  },
  {
    files: ["src/storage/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["**/ui/**", "**/ui"], message: "storage must not import from ui." }] },
      ],
    },
  },
  {
    files: ["src/ui/**/*.ts"],
    rules: {
      "no-restricted-globals": ["error", ...browserStorage],
      "no-restricted-properties": [
        "error",
        ...browserStorage.map(({ name, message }) => ({ object: "window", property: name, message })),
      ],
    },
  },
  // main.ts hands the browser storage to the store once.
  {
    files: ["src/ui/main.ts"],
    rules: { "no-restricted-properties": "off" },
  },
);
