import {promises as fs} from "fs";
import url from "url";
import path from "path";
import chalk from "chalk";
import minimist from "minimist";

// Get relative path to packager.js location from process CWD
const basepath = path.relative(process.cwd(), path.dirname(url.fileURLToPath(import.meta.url)));

/**
 * Packager Class
 * Contains helper methods for build processes
 */
export class Packager {
    /**
     * Various paths to locations of assets used in packaging process
     * @type {{src: string, dist: string}}
     */
    static paths = {
        src: `./${path.join(basepath, "src")}`,
        dist: `./${path.join(basepath, "dist")}`
    };
    
    /**
     * Specified assets used throughout the packaging process
     * @type {{entry, chunks, externals}}
     */
    static #assets = {
        entry: "scim.js",
        externals: ["util"],
        chunks: {
            "lib/config": [`${Packager.paths.src}/lib/config.js`],
            "lib/messages": [`${Packager.paths.src}/lib/messages.js`],
            "lib/resources": [`${Packager.paths.src}/lib/resources.js`],
            "lib/schemas": [`${Packager.paths.src}/lib/schemas.js`],
            "lib/types": [`${Packager.paths.src}/lib/types.js`]
        }
    };
    
    /**
     * Create a step function to consistently log action's results
     * @param {Boolean} verbose - whether or not to show extended info about action's results
     * @returns {Function} step function
     */
    static action(verbose = true) {
        /**
         * Run a step in the build process
         * @param {String} title - headline of the step to show above actions
         * @param {Object[]} actions - list of actions to run in the step
         * @param {String} actions[].pre - text to write to console before the action is initiated
         * @param {String} actions[].post - text to write to console after the action has concluded
         * @param {Function} actions[].action - method to call to run the action and retrieve output
         * @returns {Promise<void>} promise that resolves when all actions in the step have completed
         */
        return async function step(title, actions = []) {
            // Log the step's title if being verbose
            if (verbose) console.log(chalk.bold.underline(title));
            
            // Run through each action and execute it
            for (let {pre, post, action, failure} of actions) {
                try {
                    // Log name of action, execute it, and notify on completion
                    if (!!pre) process.stdout.write(pre);
                    let result = await action();
                    if (!!pre) process.stdout.write(chalk.green("done!\r\n"));
                    
                    // Log conclusion if being verbose, and post is defined
                    if (verbose && !!post) {
                        if (typeof post === "string") console.log(post);
                        // If being verbose and there were bundles output by the action, log them
                        if (result instanceof Array) for (let bundle of result) console.log(bundle);
                        if (result instanceof Function) await result();
                    }
                } catch (ex) {
                    // Notify action failure (should only come when executing action)
                    if (!!pre) process.stdout.write(`${chalk.red("failed!")}\r\n`);
                    if (ex instanceof Function) ex();
                    else console.log(`${chalk.yellow("Reason: ")}${chalk.grey(ex.message)}\r\n`);
                    if (!!failure) console.log(chalk.red(failure));
                    process.exitCode = 1;
                    process.exit();
                }
            }
            
            // Add a newline between steps
            if (verbose) console.log("");
        }
    }
    
    /**
     * Remove a specified directory and its contents
     * @param {String} target - the directory to recursively remove
     * @returns {Promise<void>} a promise that resolves when the directory has been removed
     */
    static async clean(target) {
        try {
            return await fs.rm(target, {recursive: true});
        } catch (ex) {
            if (ex.code !== "ENOENT") throw ex;
        }
    }
    
    /**
     * Build the SCIMMY library
     * @param {Boolean} [verbose=false] - whether or not to show extended output from each step of the build
     * @returns {Promise<void>} a promise that resolves when the build has completed
     */
    static async build(verbose = false) {
        const {src, dist: dest} = Packager.paths;
        const step = Packager.action(verbose);
        
        await step("Preparing Build Environment", [{
            pre: `Cleaning target build directory ${chalk.blue(dest)}: `,
            action: async () => await Packager.clean(dest)
        }]);
        
        await step("Preparing JavaScript bundles", [{
            pre: `Writing built bundles to ${chalk.blue(dest)}: `,
            post: "Wrote the following bundles:",
            action: async () => {
                let bundles = await Packager.rollup(src, dest, Packager.#assets);
                return bundles.map(file => `${chalk.grey(dest)}/${file.fileName}`);
            }
        }]);
    }
    
    /**
     * Use RollupJS to bundle sources into defined packages
     * @param {String} src - the source directory to read assets from
     * @param {String} dest - the destination directory to write bundles to
     * @param {Object} assets - entry-point and chunk files to pass to RollupJS
     * @param {String} assets.entry - entry point for RollupJS
     * @param {String[]} assets.externals - imports that are used but not local for RollupJS
     * @param {Object} assets.chunks - chunk file definitions for RollupJS
     * @returns {Promise<[OutputChunk, ...(OutputChunk | OutputAsset)[]]>}
     */
    static async rollup(src, dest, assets) {
        const rollup = await import("rollup");
        const {entry: input, chunks, externals} = assets;
        
        // Prepare RollupJS bundle with supplied entry point
        let bundle = await rollup.rollup({
            input: path.join(src, input),
            external: externals,
            onwarn: (warning, warn) => (warning.code !== "CIRCULAR_DEPENDENCY" ? warn(warning) : false)
        });
        
        // Construct the bundle with specified chunks and write to destination
        let {output} = await bundle.write({
            format: "esm",
            dir: dest,
            preferConst: true,
            minifyInternalExports: false,
            hoistTransitiveImports: false,
            entryFileNames: "[name].js",
            chunkFileNames: "[name].js",
            manualChunks: chunks
        });
        
        return output;
    }
}

if (process.argv[1] === url.fileURLToPath(import.meta.url)) {
    const config = minimist(process.argv, {alias: {t: "target"}});
    
    switch (config.target) {
        case "clean":
            await Packager.action()("Cleaning Build Directory", [
                {pre: "Cleaning build directory: ", action: async () => await Packager.clean(Packager.paths.build)}
            ]);
            break;
        
        case "build":
            await Packager.build(true);
            break;
            
        case "prepack":
            await Packager.build(false);
            break;
        
        case "lint":
            break;
        
        case "test":
            break;
            
        default:
            console.log("No target specified.");
    }
}