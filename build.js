import { minify } from "terser";
import { readFileSync, writeFileSync, mkdirSync } from "fs";

const readme = "src/README.md";
const inputFile = "src/ram-state.js";   // source file
const distDir = "dist";
const fileName = "ram-state";

// read package.json version
const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
const versionDir = `versions/${pkg.version}`;

// banner comment (will go to both files)
const banner = `/*!
 * RamStateJs v${pkg.version}
 * Description: ${pkg.description}
 * Author: ${pkg.author}
 * GitHub: ${pkg.git}
 */`;

// make sure folders exist
mkdirSync(distDir, { recursive: true });
mkdirSync(versionDir, { recursive: true });

// read source
const code = readFileSync(inputFile, "utf-8");

// write non-minified
writeFileSync(`${distDir}/${fileName}.js`, banner + "\n" + code, "utf-8");
writeFileSync(`${versionDir}/${fileName}.js`, banner + "\n" + code, "utf-8");

// minify and write
const minified = await minify(code, { output: { preamble: banner } });

writeFileSync(`${distDir}/${fileName}.min.js`, minified.code, "utf-8");
writeFileSync(`${versionDir}/${fileName}.min.js`, minified.code, "utf-8");

// copy README
const readmeContent = readFileSync(readme, "utf-8");
writeFileSync(`${distDir}/README.md`, readmeContent, "utf-8");
writeFileSync(`${versionDir}/README.md`, readmeContent, "utf-8");
writeFileSync(`README.md`, readmeContent, "utf-8");

console.log(`✅ Build complete:
 - ${distDir}/${fileName}.js
 - ${distDir}/${fileName}.min.js
 - ${distDir}/README.md
 - ${versionDir}/${fileName}.js
 - ${versionDir}/${fileName}.min.js
 - ${versionDir}/README.md`);
