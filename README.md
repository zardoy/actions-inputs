# Actions Inputs

> [GitHub Actions] Auto generate and use input parameters in TypeScript

Main goal of this module is to auto-generate **type-safe** code for working with [GitHub Actions inputs](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#inputs).

- [Actions Inputs](#actions-inputs)
  - [Use it in Your Action](#use-it-in-your-action)
  - [Casing](#casing)
  - [Things to Note](#things-to-note)
  - [Options](#options)
  - [Possible Types](#possible-types)
  - [TODO](#todo)

## Use it in Your Action

1. Install it `yarn|npm add actions-inputs`
2. Fill `action.yml` with input parameters like this:

```yml
inputs:
  # You can also use uppercase here. It doesn't really matter.
  COMMIT_MESSAGE:
    description: |
      The commit message that will be used to commit the changed files. Check the README for all interpolation options.
    # if input isn't provided, Action runner will pick default value even if required is true
    default: "auto-update: replace files from source"
    required: false
  DRY_RUN:
    # specify type explicity here if it isn't a string and you don't have default value
    description: |
      [boolean] Run everything except for the copying, removing and commiting functionality.
    required: true
  RETRIES:
    description: |
      [number] The number of retries.
    # You can specify string in default, it will be parsed to number anyway.
    default: 3
    required: false
```

3. Define `postinstall` script in `package.json`:

```json5
{
    "scripts": {
        //...
        "postinstall": "actions-inputs generate"
    }
}
```

4. Run `postinstall` script or `yarn actions-inputs generate` command in order to generate library so that you can safely use it in your code. You need to run this command every time after you edit `action.yml`.
5. Use it in your code:

```ts
import { inputs } from "actions-inputs";

inputs.dry_run
// => boolean

inputs.retries
// => 3 (if user doesn't provide their value)

```

## Casing

Despite of the [GitHub recommendation](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#inputs) to use lowercase inputs in actions, I find that inputs in uppercase more readable. And it doesn't matter what type of case.

## Things to Note

TODO test with postinstall
- You need to regenerate
- Passing an empty string is the same as not passing anything.

## Options

You can set options before first `getInput` call.

List of options: [interface Options](build/entrypointTemplate.ts).

## Possible Types

By default the type infers from input's `default` property, but if it's required and not a string, you need to specify type in start of `description` like this: `description: [boolean] should I show you a red light?`.

- [string] (default) Any value treats as valid
- [boolean] Valid: `true`, `false`, `0`, `1`
- [number] Valid: `54.33`, `Infinity`. Invalid: `5 px`

## TODO

- [ ] Auto generate type `inputs` edit in `action.yml` (show warning on `main`)
- [ ] Use **main-dev** Action deploy system (remove required)
- [ ] Add --watch options
- [ ] StringArray type
