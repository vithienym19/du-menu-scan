import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/fixtures/**"],
      // Safety-critical logic (BE-09, story 4.3): CI fails below these numbers.
      thresholds: {
        "src/warning.ts": { branches: 95, statements: 95, functions: 100, lines: 95 },
      },
    },
  },
});
