# Actions Inputs

> [GitHub Actions] Auto generate and use input parameters in TypeScript

Main goal of this module is to auto-generate **type-safe** code for working with [GitHub Actions inputs](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#inputs).

## Use it in Your Action

1. Install it `yarn|npm add actions-inputs`
2. Fill `action.yml` with input parameters like this:
```yml
inputs:
  # You can also use uppercase here. It doesn't really matter.
  COMMIT_MESSAGE:
    description: |
      The commit message that will be used to commit the changed files. Check the README for all interpolation options.
    required: false
  DRY_RUN:
    # specify type explicity here if it isn't a string and you don't have default value
    description: |
      [boolean] Run everything except for the copying, removing and commiting functionality.
    required: false
  RETRIES:
    description:
      [number] 
``
3. Run `yarn actions-inputs generate` to generate inputs so you can safely use them in your code. You need to run this command every time after you edit `action.yml`.

## Options

You can set options before first `getInput` call:

```ts
import { options } from "actions-inputs";

// default options
options = {
  // if false you will get `undefined` instead of TypeError
  throwOnMissingRequired: true,
  runtimeTypeChecking: {
    
    enable: true,
    fallbackToDefault: 
    // but if fallbackToDefault: true and there's no default value
    throwOnIncorrectType: true
  }
  // if false it won't check input type
  
};
```

### Possible Types

By default the type infers from default property, but if it required and not a string, you need to specify it in start of `description` like this: `description: [boolean] conquer

[string] (default)

## TODO

- [ ] Auto generate type `inputs` edit in `action.yml` (show warning on `main`)
- [ ] Use **main-dev** Action deploy system (remove required)
- [ ] Add --watch options
