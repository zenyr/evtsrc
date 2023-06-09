// @ts-check
const { config } = require("@swc/core/spack");

module.exports = config({
  mode: "production",
  entry: {
    web: __dirname + "/src/web.ts",
    server: __dirname + "/src/server.ts",
  },
  output: {
    name: "[name].mjs",
    path: __dirname + "/dist/esm",
  },
  module: {},
  options: { minify: true, isModule: true, sourceMaps: false },
  externalModules: ["node:events"],
});
