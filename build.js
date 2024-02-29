const path = require("path");
const AdmZip = require("adm-zip");
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
};

const createZip = () => {
    const zip = new AdmZip();
    zip.addLocalFile(MAIN_JS_PATH);
    ["icon.png"].forEach((file) => {
        zip.addLocalFile(`./static/${file}`);
    });
    zip.addFile("info.json", JSON.stringify(INFO_JSON));
    zip.writeZip(ARTIFACT_PATH);
    console.log(new Date(), "Zip created");
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