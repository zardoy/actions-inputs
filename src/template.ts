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

// from @actions/core module
export function getInput(name: string, required: boolean): string {
    const val: string = process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || ''
    if (required && !val) {
        throw new Error(`Input required and not supplied: ${name}`)
    }
    return val.trim()
}

export const inputs = new Proxy<Inputs>({} as Inputs, {
    get(_, name: keyof Inputs) {
        const throwIfNoValue = inputTypes[name].required && /*throwOnMissingRequired*/ true
        const value = core.getInput(name, {
            required: throwIfNoValue,
        })
        // would always return undefined instead of empty string
        if (value === '') {
            return undefined
        }
        // todo universal runtime type checking (rewrite)
        const parseMethod = inputTypes[name].runtimeType
        if (parseMethod === 'boolean') {
            const parsed = ['true', '1'].includes(value) ? true : ['false', '0'].includes(value) ? false : undefined
            if (options.throwOnIncorrectType && parsed === undefined) {
                throw new TypeError(`Expected boolean type, seen ${value}. Use true or false instead.`)
            } else {
                return parsed
            }
        } else if (parseMethod === 'number') {
            // Infinity still allowed!
            const parsed = !isNaN(+value) ? +value : undefined
            if (options.throwOnIncorrectType && parsed === undefined) {
                throw new TypeError(`Expected number type, seen ${value}. Use only number value.`)
            } else {
                return parsed
            }
        } else {
            return value
        }
    },
    set(_, name: string, newValue) {
        if (options.readOnlyInputs) {
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
            writable: false,
        }
    },
    ownKeys() {
        return Object.keys(process.env).filter(key => key.startsWith('INPUT_'))
    },
})
