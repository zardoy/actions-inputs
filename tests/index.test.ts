/// <reference types="jest" />
import jsYaml from 'js-yaml'
import fs from 'fs'

import { generateTypes } from '../src/generateTypes'

/** README Example */
const yamlExample = {
    inputs: {
        COMMIT_MESSAGE: {
            description: 'The commit message that will be used to commit the changed files. Check the README for all interpolation options.\n',
            default: 'auto-update: replace files from source',
            required: false,
        },
        DRY_RUN: {
            description: '[boolean] Run everything except for the copying, removing and commiting functionality.\n',
            required: true,
        },
        RETRIES: {
            description: '[number] The number of retries.\n',
            default: 3,
            required: false,
        },
    },
}

test('Generates types from example', async () => {
    const readFileSpy = jest.spyOn(fs.promises, 'readFile')
    readFileSpy.mockResolvedValueOnce('')
    const spy = jest.spyOn(jsYaml, 'load')
    spy.mockReturnValueOnce(yamlExample)
    const writeFsSpy = jest.spyOn(fs, 'writeFile')
    await generateTypes()
    const [indexJs, indexDTs] = writeFsSpy.mock.calls.map(([, contents]) => contents)
    expect(indexJs).toMatchInlineSnapshot(`
"\\"use strict\\";
Object.defineProperty(exports, \\"__esModule\\", { value: true });
exports.inputs = void 0;
exports.inputs = 5;
"
`)
    expect(indexDTs).toMatchInlineSnapshot(`
"export interface Inputs {
    /**
     * The commit message that will be used to commit the changed files. Check the README for all interpolation options.
     *
     * @default auto-update: replace files from source
     */
    COMMIT_MESSAGE?: any;
    /**
     * [boolean] Run everything except for the copying, removing and commiting functionality.
     *
     */
    DRY_RUN: any;
    /**
     * [number] The number of retries.
     *
     * @default
     */
    RETRIES?: any;
}
export declare let inputs: number;
"
`)
    writeFsSpy.mockRestore()
    readFileSpy.mockRestore()
})
