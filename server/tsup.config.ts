import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"], // Adjust according to your entry file
  outDir: "dist",
  format: ["cjs", "esm"],
  clean: true,
  dts: true,
  sourcemap: true,
  minify: false,
  splitting: false,
  skipNodeModulesBundle: true,
  noExternal: [],
  loader: {
    ".sql": "file", // Treats .sql files as static files
  },
  ignoreWatch: ["src/db/schemas/**/*.sql"], // Prevents watching .sql files
});
