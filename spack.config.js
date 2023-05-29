const { config } = require("@swc/core/spack");

module.exports = config({
  mode: "production",
  entry: {
    web: __dirname + "/src/web.ts",
    server: __dirname + "/src/server.ts",
  },
  output: {
    path: __dirname + "/dist/min",
  },
  module: {},
  options: { minify: true },
  externalModules: ["node:events"],
});
