const { config } = require("@swc/core/spack");

module.exports = config({
  mode: "production",
  entry: {
    web: __dirname + "/src/index.ts",
    server: __dirname + "/src/index.node.ts",
  },
  output: {
    path: __dirname + "/dist/min",
  },
  module: {},
  options: { minify: true },
  externalModules: ["node:events"],
});
