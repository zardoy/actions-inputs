interface InputsTypes {
    [inputName: string]: {
        required: boolean
        runtimeType: 'boolean' | 'number' | 'string'
    }
}

interface Inputs {
    [inputName: string]: string | boolean | number
}

export const inputTypes: InputsTypes = {}

// runtime options
let readOnlyInputs = true

// from @actions/core module
export function getInput(name: string, required: boolean): string {
    const val: string = process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || ''
    if (required && !val) {
        throw new Error(`Input required and not supplied: ${name}`)
    }
    return val.trim()
}

export const inputs = new Proxy<Inputs>({} as Inputs, {
    get(_, name: string) {
        const isRequired = inputTypes[name]!.required
        const inputValue = getInput(name, isRequired)
        // if input is missing return undefined instead of empty string
        if (inputValue === '') {
            return undefined
        }
        const parseMethod = inputTypes[name]!.runtimeType
        // return parsed value from switch
        return (() => {
            switch (parseMethod) {
                case 'boolean':
                    const bool = ['true', '1'].includes(inputValue) ? true : ['false', '0'].includes(inputValue) ? false : undefined
                    if (bool === undefined) throw new TypeError(`Expected boolean type, seen ${inputValue}. Use true or false instead.`)
                    return bool
                case 'number':
                    const num = +inputValue
                    // empty string shouldn't be zero
                    if (inputValue === '' || !isFinite(num)) throw new TypeError(`Expected number type, seen ${inputValue}. Use only number value.`)
                    return num
                case 'string':
                    return inputValue
            }
        })()
    },
    set(_, name: string, newValue) {
        if (readOnlyInputs) {
            return false
        } else {
            // assumed that user uses TypeScript for type checking so there is no runtime type checking
            process.env[`INPUT_${name.toUpperCase()}`] = String(newValue).trim()
            return true
        }
    },
    getOwnPropertyDescriptor() {
        return {
            enumerable: true,
            configurable: true,
            writable: readOnlyInputs,
        }
    },
    ownKeys() {
        return Object.keys(process.env).filter(key => key.startsWith('INPUT_'))
    },
})
