import { Project, StructureKind } from 'ts-morph'
import { compilerOptions } from 'generated-module/build/ts-morph-utils'
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
    'action-yml-path': undefined,
    /** runtime specific options */
    runtime: {
        /**
         * Set this to `false` to get `undefined` instead of TypeError if required input is missing
         */
        // TODO typings on false
        throwOnMissingRequired: true,
        /**
         * Set this to `false` to get `unefined` instead of TypeError if input's type differs
         */
        throwOnIncorrectType: true, // todo more options
        /**
         * If `true` setting new value to input will throw a TypeError
         */
        readOnlyInputs: false,
    },
}

export type Options = Partial<typeof defaultOptions>

export const generateTypes = async (options: Options = {}) => {
    const moduleName = '.actions-inputs'
    const modulePath = join(process.cwd(), `node_modules/${moduleName}`)
    await ensureDir(modulePath)

    const project = new Project({
        compilerOptions: {
            declaration: true,
            ...compilerOptions,
        },
    })

    const yaml = parseYaml(await fs.promises.readFile(options['action-yml-path'] ?? join(process.cwd(), 'action.yml'), 'utf-8'))

    const source = project.createSourceFile(join(modulePath, 'index.ts'), {
        statements: [
            {
                kind: StructureKind.Interface,
                name: 'Inputs',
                // properties:
                isExported: true,
            },
            {
                kind: StructureKind.VariableStatement,
                isExported: true,
                declarations: [
                    {
                        name: 'inputs',
                        initializer: writer => {
                            writer.writeLine('5')
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
