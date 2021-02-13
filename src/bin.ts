#!/usr/bin/env node

// todo run postinstall

import execa from "execa";
import fs from "fs";
import { load } from "js-yaml";
import minimist from "minimist";
import path from "path";
import { replaceInFileSync } from "replace-in-file";

// todo improve args system
type ExpectedArgs = ReturnType<typeof minimist> & {
    help?: boolean;
    /**
     * @default preserve
     */
    case?: "preserve" | "lower" | "upper";
    /**
     * @default CWD/action.yml
     */
    actionymlpath?: string;
    /**
     * @default true
     */
    generatejsdoc?: string;
};

interface ActionYmlWithInputs {
    inputs: {
        [INPUT: string]: {
            description?: string;
            required?: boolean;
            default?: number | boolean | string;
        };
    };
}

const isActionYmlWithInputs = (obj: any): obj is ActionYmlWithInputs => {
    return obj?.inputs && typeof obj.inputs === "object";
};

const args: ExpectedArgs = minimist(process.argv);

const normalizeInputName = (inputName: string): string => {
    let { case: argCase = "preserve" } = args;
    return argCase === "lower" ? inputName.toLowerCase() :
        argCase === "upper" ? inputName.toUpperCase() : inputName;
};

const supportedTypes = ["boolean", "number", "string"];

// todo more clean code with commands
if (args._.includes("generate")) {
    const production = fs.existsSync(path.resolve(__dirname, "index.js"));
    const entrypointFile = "entrypointTemplate.ts";
    const entrypointTemplatePath = production ?
        path.resolve(__dirname, entrypointFile) :
        path.resolve(__dirname, "../build", entrypointFile);
    if (!fs.existsSync(entrypointTemplatePath)) {
        throw new TypeError(`Template for generating doesn't exist on path: ${entrypointTemplatePath}`);
    }
    const destFile = production ?
        // up-pkg alternative?
        path.resolve(__dirname, "index.ts") :
        path.resolve(__dirname, "../test-output.ts");

    const actionYmlPath = args.actionymlpath || path.join(process.cwd(), "action.yml");
    const actionYml = load(
        fs.readFileSync(actionYmlPath, "utf-8")
    );
    if (!isActionYmlWithInputs(actionYml)) {
        throw new TypeError(`action.yml on path ${actionYmlPath} seems to be invalid. Please check inputs property of it.`);
    }
    let generatedInterface = "",
        generatedInputsConfig = "";
    Object.entries(actionYml.inputs).forEach(([rawInputName, { default: defaultVal, description: rawDescription, required }]) => {
        const hasDefaultVal = defaultVal !== undefined;
        const inputName = normalizeInputName(rawInputName);
        if (/\s/.test(rawInputName)) {
            throw new TypeError(`Input with name ${rawInputName} must not contain any space characters`);
        }
        // todo replace warn
        if (!rawDescription) console.warn(`Input ${rawInputName} missing description property!`);
        // New lines (\n) are ignored by VSCode so we are replacing them by regular space
        const description = rawDescription ? rawDescription.replace(/\n/g, " ").trim() : "";
        const inputType =
            (description && /^\[(.+)\]/.exec(description)?.[1]) ||
            (hasDefaultVal ? (typeof defaultVal) : "string");
        if (!supportedTypes.includes(inputType)) {
            throw new TypeError(`Input ${rawInputName} has unsupported type ${inputType}. Supported types are ${supportedTypes.join(", ")}`);
        }
        const defaultAnnotation = hasDefaultVal ? `\n * @default ${defaultVal}` : "";
        // todo use JSDoc generater
        const jsDoc = args.generatejsdoc !== "false" || description || defaultAnnotation ? `
/**
 * ${description} ${defaultAnnotation}
 */` : "";
        generatedInterface += `${jsDoc}
${inputName}: ${inputType}`;
        generatedInputsConfig += `
${inputName}: {
    required: ${required ?? false},
    runtimeType: "${inputType}"
},`;
    });
    fs.copyFileSync(entrypointTemplatePath, destFile);
    replaceInFileSync({
        files: destFile,
        from: "//AUTOGEN-REPLACE-CONFIG",
        to: generatedInputsConfig
    });
    replaceInFileSync({
        files: destFile,
        from: "//AUTOGEN-REPLACE-INTERFACE",
        to: generatedInterface
    });

    if (production) {
        execa.sync("tsc", {
            cwd: __dirname,
            preferLocal: true,
            stdio: "inherit"
        });
    }
} else {
    console.log(`
Available commands:

generate  Generate actions-input
`);
}