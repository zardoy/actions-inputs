import { Project, StatementStructures, StructureKind, Writers } from 'ts-morph'
import { compilerOptions, createJsdoc } from 'generated-module/build/ts-morph-utils'
import { join } from 'path'
import { ensureDir } from 'fs-extra'
import fs from 'fs'
import { load as parseYaml } from 'js-yaml'

const defaultOptions = {
    /**
     * @default preserve
     */
    case: 'preserve' as 'preserve' | 'lower' | 'upper',
    /**
     * @default CWD/action.yml
     */
    actionYmlPath: undefined as string | undefined,
    /** runtime specific options */
    /**
     * Set this to `false` to get `undefined` instead of TypeError if required input is missing
     */
    throwOnMissingRequired: true,
    /**
     * Set this to `false` to get `unefined` instead of TypeError if input's type differs
     */
    throwOnIncorrectType: true, // todo more options
    /**
     * If `true` setting new value to input will throw a TypeError
     */
    readOnlyInputs: false,
}

export type Options = Partial<typeof defaultOptions>

export const generateTypes = async ({
    actionYmlPath = join(process.cwd(), 'action.yml'),
    case: inputNameCase = 'preserve',
    readOnlyInputs = false,
    throwOnIncorrectType = true,
    throwOnMissingRequired = true,
}: Options = {}) => {
    const moduleName = '.actions-inputs'
    const modulePath = join(process.cwd(), `node_modules/${moduleName}`)
    await ensureDir(modulePath)

    const project = new Project({
        compilerOptions: {
            declaration: true,
            ...compilerOptions,
        },
    })

    interface ActionYaml {
        inputs: {
            [name: string]: {
                description: string
                default?: string
                required: boolean
            }
        }
    }

    const yaml = parseYaml(await fs.promises.readFile(actionYmlPath, 'utf-8')) as ActionYaml

    const inputInterface: StatementStructures = {
        kind: StructureKind.Interface,
        name: 'Inputs',
        properties: [],
        // properties:
        isExported: true,
    }
    const supportedTypes = ['boolean', 'number', 'string'] as const

    const runtimeTypes: Record<string, { runtimeType: keyof typeof supportedTypes; isRequired: boolean }> = {}

    for (const [inputName, { default: defaultValue, description, required }] of Object.entries(yaml.inputs)) {
        if (/\s/.test(inputName)) {
            throw new TypeError(`Input with name ${inputName} must not contain any space characters`)
        }
        if (!description) console.warn(`Input ${inputName} should have description property!`)

        const inputNameWithCasing = (() => {
            switch (inputNameCase) {
                case 'lower':
                    return inputName.toLowerCase()
                case 'preserve':
                    return inputName
                case 'upper':
                    return inputName.toUpperCase()
            }
        })()

        const inputType =
            (description && /^\[(.+)\]/.exec(description)?.[1]) ||
            (defaultValue
                ? // it won't work if user follows schema (which is not requried)
                  typeof defaultValue
                : 'string')

        /** loose arr.includes() */
        const isArrayType = <T>(array: readonly T[], incomingType: any): incomingType is T => array.includes(incomingType)

        if (!isArrayType(supportedTypes, inputType)) throw new TypeError(`Input ${inputName} has unsupported types are ${inputType}`)

        inputInterface.properties!.push({
            name: inputNameWithCasing,
            hasQuestionToken: throwOnMissingRequired ? !required : true,
            isReadonly: readOnlyInputs,
            docs: createJsdoc({
                default: defaultValue,
                description,
            }),
        })
        runtimeTypes[inputNameWithCasing]
    }

    const source = project.createSourceFile(join(modulePath, 'index.ts'), {
        statements: [
            inputInterface,
            {
                kind: StructureKind.VariableStatement,
                isExported: true,
                declarations: [
                    {
                        name: 'inputTypes',
                        initializer: writer => {
                            Writers.object({})
                            writer('5')
                        },
                    },
                ],
            },
        ],
    })

    const diagnostics = project.getPreEmitDiagnostics()
    if (diagnostics.length) {
        console.error(project.formatDiagnosticsWithColorAndContext(diagnostics))
        throw new Error('Failed to generate fresh types, there are now out of sync!')
    }

    await project.emit()
}
