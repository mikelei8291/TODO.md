import { context } from "esbuild";
import htmlPlugin from "@chialab/esbuild-plugin-html";

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
    name: 'esbuild-problem-matcher',

    setup(build) {
        build.onStart(() => {
            console.log('[watch] build started');
        });
        build.onEnd((result) => {
            result.errors.forEach(({ text, location }) => {
                console.error(`✘ [ERROR] ${text}`);
                console.error(`    ${location.file}:${location.line}:${location.column}:`);
            });
            console.log('[watch] build finished');
        });
    },
};

async function main() {
    const ctx = await context({
        entryPoints: [
            "src/extension.ts",
            "src/static/index.html",
            "src/static/empty.html"
        ],
        bundle: true,
        format: "cjs",
        minify: production,
        sourcemap: !production,
        sourcesContent: false,
        platform: "node",
        outdir: "dist",
        entryNames: "[dir]/[name]",
        assetNames: "assets/[name]-[hash]",
        chunkNames: "[ext]/[name]-[hash]",
        external: ["vscode"],
        loader: {
            ".ttf": "copy"
        },
        logLevel: "silent",
        plugins: [
            esbuildProblemMatcherPlugin,
            htmlPlugin()
        ],
    });
    if (watch) {
        await ctx.watch();
    } else {
        await ctx.rebuild();
        await ctx.dispose();
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
