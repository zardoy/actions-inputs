// these types will be overrided in generated variant (eg in /node_modules/.actions-inputs/)
import * as core from "@actions/core";

// todo auto-generate @default JSDoc
interface Options {
    /**
     * Set this to `false` to get `undefined` instead of TypeError if required input is missing
     */
    throwOnMissingRequired: boolean;
    /**
     * Set this to `false` to get `unefined` instead of TypeError if input's type differs
     */
    throwOnIncorrectType: boolean;
    /**
     * If `true` setting new value to input will throw a TypeError
     */
    readOnlyInputs: false;
}

export let options: Options = {
    // todo update typings on false
    throwOnMissingRequired: true,
    throwOnIncorrectType: true, // todo more options
    readOnlyInputs: false
};

interface InputsConifg {
    [inputName: string]: {
        required: boolean;
        runtimeType: "boolean" | "number" | "string";
    };
}

const inputsConfig: InputsConifg = {
    //AUTOGEN-REPLACE-CONFIG
};


interface Inputs {
    //AUTOGEN-REPLACE-INTERFACE
}

export const inputs = new Proxy<Inputs>({} as Inputs, {
    get(_, name: keyof Inputs) {
        const throwIfNoValue = options.throwOnMissingRequired && inputsConfig[name].required;
        const result = core.getInput(name, {
            required: throwIfNoValue
        });
        // would always return undefined instead of empty string
        if (result === "") {
            return undefined;
        }
        // todo universal runtime type checking (rewrite)
        const parseMethod = inputsConfig[name].runtimeType;
        if (parseMethod === "boolean") {
            const parsed = ["true", "1"].includes(result) ? true :
                ["false", "0"].includes(result) ? false : undefined;
            if (options.throwOnIncorrectType && parsed === undefined) {
                throw new TypeError(`Expected boolean type, seen ${result}. Use true or false instead.`);
            } else {
                return parsed;
            }
        } else if (parseMethod === "number") {
            // Infinity still allowed!
            const parsed = !isNaN(+result) ? +result : undefined;
            if (options.throwOnIncorrectType && parsed === undefined) {
                throw new TypeError(`Expected number type, seen ${result}. Use only number value.`);
            } else {
                return parsed;
            }
        } else {
            return result;
        }
    },
    set(_, name: string, newValue) {
        if (options.readOnlyInputs) {
            return false;
        } else {
            // assumed that user uses TypeScript for type checking so there is no runtime type checking
            process.env[`INPUT_${name.toUpperCase()}`] = String(newValue).trim();
            return true;
        }
    },
    getOwnPropertyDescriptor() {
        return {
            enumerable: true,
            configurable: true,
            writable: false
        };
    },
    ownKeys() {
        return Object.keys(process.env).filter(key => key.startsWith('INPUT_'));
    }
});