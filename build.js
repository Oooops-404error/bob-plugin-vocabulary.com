const path = require("path");
const AdmZip = require("adm-zip");
const fs = require("fs");
const crypto = require("crypto");
const { version } = require("./package.json");

const MAIN_JS_PATH = path.resolve(__dirname, "./dist/main.js");
const PLUGIN_NAME = `bob-plugin-vocabulary.com@${version}.bobplugin`;
const ARTIFACT_PATH = path.resolve(__dirname, `./release/${PLUGIN_NAME}`);

const INFO_JSON = {
    identifier: "com.oooops.404error.vocabulary.translate",
    version: version,
    category: "translate",
    name: "Vocabulary",
    author: "Oooops-404error",
    summary: "A powerful English-English dictionary using vocabulary.com",
    homepage: "https://github.com/Oooops-404error/bob-plugin-vocabulary.com",
    minBobVersion: "1.8.0",
    appcast: "https://raw.githubusercontent.com/Oooops-404error/bob-plugin-vocabulary.com/main/appcast.json"
};

const initAppcast = () => {
    const fileBuffer = fs.readFileSync(ARTIFACT_PATH);
    const sha = crypto.createHash("sha256");
    sha.update(fileBuffer);
    const hex = sha.digest("hex");
    const currentVersionInfo = {
        version: version,
        desc: `见 https://github.com/Oooops-404error/bob-plugin-vocabulary.com/releases`,
        sha256: hex,
        url: `https://github.com/Oooops-404error/bob-plugin-vocabulary.com/releases/download/v${version}/bob-plugin-vocabulary.com@${version}.bobplugin`,
        minBobVersion: INFO_JSON.minBobVersion,
        timestamp: Date.now()
    };
    let appcastPath = path.resolve(__dirname, "./appcast.json");
    const appcast = JSON.parse(fs.readFileSync(appcastPath, "utf-8"));
    if (!appcast.versions.find((item) => item.version === currentVersionInfo.version)) {
        appcast.versions.unshift(currentVersionInfo);
        fs.writeFileSync(appcastPath, JSON.stringify(appcast, null, 2), { encoding: "utf-8" });
    }
};

const isRelease = process.argv.includes("--release");
const createZip = () => {
    const zip = new AdmZip();
    zip.addLocalFile(MAIN_JS_PATH);
    ["icon.png"].forEach((file) => {
        zip.addLocalFile(`./static/${file}`);
    });
    zip.addFile("info.json", JSON.stringify(INFO_JSON));
    zip.writeZip(ARTIFACT_PATH);
    console.log(new Date(), "Zip created");
    isRelease && initAppcast();
};

require("esbuild")
    .build({
        entryPoints: ["./src/entry.ts"],
        bundle: true,
        platform: "node",
        treeShaking: false,
        outfile: MAIN_JS_PATH
    })
    .then(() => {
        createZip();
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });