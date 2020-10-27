import cfg from "./rollup.config";

cfg.input = "src/tests.ts";
cfg.output = [
  {
    file: "./build/index.test.js",
    format: "cjs",
    sourcemap: true,
    globals: {
      it: "it",
      describe: "describe",
    },
  },
];

export default cfg;
