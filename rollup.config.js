import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import copy from "rollup-plugin-copy";

const BUILD_DIR = "/private/tmp/obsidian-recall-build";

export default {
    input: "src/main.ts",
    output: {
        dir: BUILD_DIR,
        sourcemap: "inline",
        format: "cjs",
        exports: "default",
    },
    external: ["obsidian"],
    plugins: [
        typescript(),
        nodeResolve({ browser: true }),
        commonjs(),
        copy({
            targets: [
                { src: "manifest.json", dest: BUILD_DIR },
                { src: "styles.css", dest: BUILD_DIR },
            ],
            hook: "writeBundle",
        }),
    ],
};
